import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.BindException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executors;

public class App {
    private static final Path PROJECT_DIR = resolveProjectDir();
    private static final Path PUBLIC_DIR = PROJECT_DIR.resolve("public").normalize();
    private static final Path STORAGE_DIR = PROJECT_DIR.resolve("storage").normalize();
    private static final Path UPLOAD_DIR = STORAGE_DIR.resolve("uploads");
    private static final Path LICENSE_DIR = STORAGE_DIR.resolve("licenses");
    private static final Path CATALOG_FILE = STORAGE_DIR.resolve("catalog.json");
    private static final int DEFAULT_PORT = 4173;

    public static void main(String[] args) throws Exception {
        Files.createDirectories(PUBLIC_DIR);
        Files.createDirectories(UPLOAD_DIR);
        Files.createDirectories(LICENSE_DIR);
        ensureCatalog();

        int requestedPort = getPort();
        ServerBinding binding = createServer(requestedPort);
        HttpServer server = binding.server;
        server.createContext("/api/upload", App::handleUpload);
        server.createContext("/api/delete", App::handleDelete);
        server.createContext("/api/catalog", App::handleCatalog);
        server.createContext("/api/checkout", App::handleCheckout);
        server.createContext("/", App::handleStatic);
        server.setExecutor(Executors.newFixedThreadPool(8));
        server.start();

        if (binding.port != requestedPort) {
            System.out.println("Port " + requestedPort + " was busy, so the beatstore started on port " + binding.port + ".");
        }
        System.out.println("Blarkkeys Beatstore is live at http://localhost:" + binding.port);
        System.out.println("Admin demo PIN: 0000");
    }

    private static ServerBinding createServer(int requestedPort) throws IOException {
        boolean fixedPort = System.getenv("PORT") != null && !System.getenv("PORT").isBlank();
        int maxAttempts = fixedPort ? 1 : 20;

        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            int port = requestedPort + attempt;
            try {
                return new ServerBinding(HttpServer.create(new InetSocketAddress("0.0.0.0", port), 0), port);
            } catch (BindException error) {
                if (attempt == maxAttempts - 1) {
                    throw error;
                }
            }
        }

        throw new BindException("No available port found near " + requestedPort);
    }

    private static int getPort() {
        String value = System.getenv("PORT");
        if (value == null || value.isBlank()) {
            return DEFAULT_PORT;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException error) {
            return DEFAULT_PORT;
        }
    }

    private record ServerBinding(HttpServer server, int port) {
    }

    private static Path resolveProjectDir() {
        Path cwd = Paths.get("").toAbsolutePath().normalize();
        if (Files.exists(cwd.resolve("public").resolve("index.html"))) {
            return cwd;
        }

        try {
            Path classDir = Paths.get(App.class.getProtectionDomain().getCodeSource().getLocation().toURI())
                    .toAbsolutePath()
                    .normalize();
            Path parent = classDir.getParent();
            if (parent != null && Files.exists(parent.resolve("public").resolve("index.html"))) {
                return parent;
            }
        } catch (Exception ignored) {
            // Fall back to the working directory below.
        }

        if (cwd.getFileName() != null && "src".equals(cwd.getFileName().toString())) {
            Path parent = cwd.getParent();
            if (parent != null && Files.exists(parent.resolve("public").resolve("index.html"))) {
                return parent;
            }
        }

        return cwd;
    }

    private static void handleCatalog(HttpExchange exchange) throws IOException {
        addSecurityHeaders(exchange);
        if ("GET".equals(exchange.getRequestMethod())) {
            send(exchange, 200, "application/json", Files.readString(CATALOG_FILE));
            return;
        }
        send(exchange, 405, "application/json", "{\"error\":\"Method not allowed\"}");
    }

    private static void handleCheckout(HttpExchange exchange) throws IOException {
        addSecurityHeaders(exchange);
        if (!"POST".equals(exchange.getRequestMethod())) {
            send(exchange, 405, "application/json", "{\"error\":\"Method not allowed\"}");
            return;
        }

        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        String orderId = "BK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String response = "{"
                + "\"orderId\":\"" + orderId + "\","
                + "\"status\":\"ready_for_processor\","
                + "\"message\":\"Connect PayPal Checkout or a PCI-compliant bank card processor before accepting live money.\","
                + "\"received\":" + jsonString(body)
                + "}";
        send(exchange, 200, "application/json", response);
    }

    private static void handleUpload(HttpExchange exchange) throws IOException {
        addSecurityHeaders(exchange);
        if (!"POST".equals(exchange.getRequestMethod())) {
            send(exchange, 405, "application/json", "{\"error\":\"Method not allowed\"}");
            return;
        }

        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        Map<String, String> form = parseForm(body);
        String id = "track-" + UUID.randomUUID();
        String title = form.getOrDefault("title", "Untitled Beat").trim();
        String category = form.getOrDefault("category", "beats").trim();
        String genre = form.getOrDefault("genre", "hip hop").trim();
        String price = form.getOrDefault("price", "29.99").trim();
        String bpm = form.getOrDefault("bpm", "90").trim();
        String key = form.getOrDefault("key", "A minor").trim();
        String fileName = safeFileName(form.getOrDefault("fileName", title + ".mp3"));
        String audioData = form.getOrDefault("audioData", "");

        Path uploadPath = UPLOAD_DIR.resolve(id + "-" + fileName).normalize();
        if (!uploadPath.startsWith(UPLOAD_DIR)) {
            send(exchange, 400, "application/json", "{\"error\":\"Invalid file name\"}");
            return;
        }

        if (audioData.startsWith("data:")) {
            String[] parts = audioData.split(",", 2);
            if (parts.length == 2) {
                Files.write(uploadPath, java.util.Base64.getDecoder().decode(parts[1]));
            }
        } else {
            Files.writeString(uploadPath, "Demo placeholder for " + title, StandardCharsets.UTF_8);
        }

        Path licensePath = createLicense(id, title, category, genre, price, bpm, key);
        String item = "{"
                + "\"id\":\"" + escape(id) + "\","
                + "\"title\":\"" + escape(title) + "\","
                + "\"category\":\"" + escape(category) + "\","
                + "\"genre\":\"" + escape(genre) + "\","
                + "\"price\":" + numberOrDefault(price, "29.99") + ","
                + "\"bpm\":" + numberOrDefault(bpm, "90") + ","
                + "\"key\":\"" + escape(key) + "\","
                + "\"producer\":\"blarkkeys\","
                + "\"file\":\"/storage/uploads/" + escape(uploadPath.getFileName().toString()) + "\","
                + "\"license\":\"/storage/licenses/" + escape(licensePath.getFileName().toString()) + "\","
                + "\"createdAt\":\"" + LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "\""
                + "}";
        appendCatalogItem(item);
        send(exchange, 200, "application/json", item);
    }

    private static void handleDelete(HttpExchange exchange) throws IOException {
        addSecurityHeaders(exchange);
        if (!"POST".equals(exchange.getRequestMethod())) {
            send(exchange, 405, "application/json", "{\"error\":\"Method not allowed\"}");
            return;
        }

        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        Map<String, String> form = parseForm(body);
        String id = form.getOrDefault("id", "").trim();
        if (id.isEmpty()) {
            send(exchange, 400, "application/json", "{\"error\":\"Missing id\"}");
            return;
        }

        boolean removed = removeCatalogItem(id);
        send(exchange, removed ? 200 : 404, "application/json", "{\"removed\":" + removed + "}");
    }

    private static void handleStatic(HttpExchange exchange) throws IOException {
        addSecurityHeaders(exchange);
        URI uri = exchange.getRequestURI();
        String rawPath = URLDecoder.decode(uri.getPath(), StandardCharsets.UTF_8);
        Path base = rawPath.startsWith("/storage/") ? STORAGE_DIR.getParent() : PUBLIC_DIR;
        Path target = (rawPath.equals("/") ? PUBLIC_DIR.resolve("index.html") : base.resolve(rawPath.substring(1))).normalize();

        if (!target.startsWith(PUBLIC_DIR) && !target.startsWith(STORAGE_DIR)) {
            send(exchange, 403, "text/plain", "Forbidden");
            return;
        }
        if (!Files.exists(target) || Files.isDirectory(target)) {
            send(exchange, 404, "text/plain", "Not found");
            return;
        }
        send(exchange, 200, contentType(target), Files.readAllBytes(target));
    }

    private static Path createLicense(String id, String title, String category, String genre, String price, String bpm, String key)
            throws IOException {
        String fileName = id + "-license.txt";
        Path path = LICENSE_DIR.resolve(fileName);
        String issuedAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        String license = "BLARKKEYS STANDARD CONTENT LICENSE\n"
                + "License ID: " + id + "\n"
                + "Issued: " + issuedAt + "\n"
                + "Producer: blarkkeys (black keys)\n"
                + "Content: " + title + "\n"
                + "Category: " + category + "\n"
                + "Genre: " + genre + "\n"
                + "BPM/Key: " + bpm + " BPM, " + key + "\n"
                + "List Price: " + price + "\n\n"
                + "Grant: The buyer receives a non-exclusive license to create and distribute one new work using this content.\n"
                + "Restrictions: Resale, redistribution, Content ID registration of the raw beat/sample, and claiming producer ownership are not allowed.\n"
                + "Ownership: blarkkeys keeps master and publishing rights to the original beat, loop, or sample.\n"
                + "Note: Replace this template with legal counsel-approved license terms before live commerce.\n";
        Files.writeString(path, license, StandardCharsets.UTF_8);
        return path;
    }

    private static void appendCatalogItem(String item) throws IOException {
        String catalog = Files.readString(CATALOG_FILE);
        int insertAt = catalog.lastIndexOf(']');
        String prefix = catalog.substring(0, insertAt).trim();
        String suffix = catalog.substring(insertAt);
        String updated = prefix.endsWith("[") ? prefix + "\n  " + item + "\n" + suffix : prefix + ",\n  " + item + "\n" + suffix;
        Files.writeString(CATALOG_FILE, updated, StandardCharsets.UTF_8);
    }

    private static boolean removeCatalogItem(String id) throws IOException {
        String catalog = Files.readString(CATALOG_FILE).trim();
        if (catalog.length() < 2) {
            return false;
        }

        java.util.List<String> items = splitCatalogItems(catalog);
        java.util.List<String> kept = new java.util.ArrayList<>();
        boolean removed = false;
        String needle = "\"id\":\"" + escape(id) + "\"";
        for (String item : items) {
            if (item.contains(needle)) {
                removed = true;
            } else {
                kept.add(item);
            }
        }

        if (removed) {
            String updated = kept.isEmpty() ? "[]" : "[\n  " + String.join(",\n  ", kept) + "\n]";
            Files.writeString(CATALOG_FILE, updated, StandardCharsets.UTF_8);
        }
        return removed;
    }

    private static java.util.List<String> splitCatalogItems(String catalog) {
        java.util.List<String> items = new java.util.ArrayList<>();
        int depth = 0;
        int start = -1;
        boolean inString = false;
        boolean escaped = false;

        for (int index = 0; index < catalog.length(); index++) {
            char current = catalog.charAt(index);
            if (escaped) {
                escaped = false;
                continue;
            }
            if (current == '\\' && inString) {
                escaped = true;
                continue;
            }
            if (current == '"') {
                inString = !inString;
                continue;
            }
            if (inString) {
                continue;
            }
            if (current == '{') {
                if (depth == 0) {
                    start = index;
                }
                depth++;
            } else if (current == '}') {
                depth--;
                if (depth == 0 && start >= 0) {
                    items.add(catalog.substring(start, index + 1));
                    start = -1;
                }
            }
        }

        return items;
    }

    private static void ensureCatalog() throws IOException {
        if (Files.exists(CATALOG_FILE)) {
            return;
        }
        Files.writeString(CATALOG_FILE, "[]", StandardCharsets.UTF_8);
    }

    private static Map<String, String> parseForm(String body) {
        Map<String, String> result = new HashMap<>();
        for (String pair : body.split("&")) {
            String[] parts = pair.split("=", 2);
            if (parts.length == 2) {
                result.put(urlDecode(parts[0]), urlDecode(parts[1]));
            }
        }
        return result;
    }

    private static String urlDecode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private static String safeFileName(String name) {
        return name.replaceAll("[^A-Za-z0-9._-]", "-");
    }

    private static String escape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static String jsonString(String value) {
        return "\"" + escape(value) + "\"";
    }

    private static String numberOrDefault(String value, String fallback) {
        return value.matches("\\d+(\\.\\d+)?") ? value : fallback;
    }

    private static String contentType(Path target) {
        String name = target.getFileName().toString().toLowerCase();
        if (name.endsWith(".html")) return "text/html; charset=utf-8";
        if (name.endsWith(".css")) return "text/css; charset=utf-8";
        if (name.endsWith(".js")) return "application/javascript; charset=utf-8";
        if (name.endsWith(".json")) return "application/json; charset=utf-8";
        if (name.endsWith(".mp3")) return "audio/mpeg";
        if (name.endsWith(".wav")) return "audio/wav";
        if (name.endsWith(".txt")) return "text/plain; charset=utf-8";
        return "application/octet-stream";
    }

    private static void addSecurityHeaders(HttpExchange exchange) {
        Headers headers = exchange.getResponseHeaders();
        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("X-Frame-Options", "DENY");
        headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; media-src 'self' blob: data:; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'");
    }

    private static void send(HttpExchange exchange, int status, String contentType, String body) throws IOException {
        send(exchange, status, contentType, body.getBytes(StandardCharsets.UTF_8));
    }

    private static void send(HttpExchange exchange, int status, String contentType, byte[] body) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(status, body.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(body);
        }
    }
}
