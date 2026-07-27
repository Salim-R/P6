export interface Sauce {
  _id: string;
  userId: string;
  name: string;
  manufacturer: string;
  description: string;
  mainPepper: string;
  imageUrl: string;
  heat: number;
  likes: number;
  dislikes: number;
  usersLiked: string[];
  usersDisliked: string[];
}

/** Charge utile envoyée à l'API : l'API impose l'auteur et les compteurs. */
export type SaucePayload = Pick<
  Sauce,
  'name' | 'manufacturer' | 'description' | 'mainPepper' | 'heat'
>;

/** Valeur du vote acceptée par l'API. */
export type Vote = 1 | 0 | -1;
