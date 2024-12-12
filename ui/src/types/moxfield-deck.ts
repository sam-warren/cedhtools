import { MoxfieldBoardCard, MoxfieldMainCard } from "./moxfield-card";

export interface MoxfieldBoard {
    count: number;
    cards: {
        [key: string]: MoxfieldBoardCard;
    };
}

export interface MoxfieldAuthor {
    userName: string;
    displayName: string;
    profileImageUrl: string;
    badges: string[];
}


export interface MoxfieldDeck {
    id: string;
    name: string;
    description: string;
    format: string;
    visibility: string;
    publicUrl: string;
    publicId: string;
    likeCount: number;
    viewCount: number;
    commentCount: number;
    sfwCommentCount: number;
    areCommentsEnabled: boolean;
    isShared: boolean;
    authorsCanEdit: boolean;
    createdByUser: MoxfieldAuthor;
    authors: MoxfieldAuthor[];
    requestedAuthors: MoxfieldAuthor[];
    main: MoxfieldMainCard;
    boards: {
        [key: string]: MoxfieldBoard;
    };
}