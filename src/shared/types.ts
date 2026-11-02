export interface Project {
  id: number;
  title: string;
  path: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithCards extends Project {
  cards: CardSummary[];
  cardCounts: {
    todo: number;
    in_progress: number;
    done: number;
  };
}

export interface CardSummary {
  id: number;
  title: string;
  status: CardStatus;
}

export interface Card {
  id: number;
  title: string;
  status: CardStatus;
  project_id: number;
  path: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CardWithContent extends Card {
  comments: CommentWithContent[];
  project_slug?: string;
  slug?: string;
}

export type CardStatus = 'todo' | 'in_progress' | 'done';

export interface Comment {
  id: number;
  card_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CommentWithContent extends Comment {
  content: string;
}

export interface CreateProjectInput {
  title: string;
}

export interface UpdateProjectInput {
  title?: string;
}

export interface CreateCardInput {
  title: string;
  description: string;
}

export interface UpdateCardInput {
  title?: string;
  status?: CardStatus;
  content?: string;
}

export interface CreateCommentInput {
  content: string;
}
