export interface Beat {
  id: string;
  title: string;
  producer: string;
  bpm: number;
  key: string;
  price: number;
  coverArt: string;
  audioUrl: string;
  tags: string[];
}