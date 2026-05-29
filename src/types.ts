export interface Card {
  title: string;
  text: string;
  image: string | null;
  image_caption: string | null;
  code: string | null;
  link: string | null;
}

export interface LF {
  label: string;
  topics: Record<string, Card[]>;
}

export type Data = Record<string, LF>;
