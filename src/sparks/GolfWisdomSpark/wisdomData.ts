// Golf Wisdom data - Jerry's inspirational golf quotes

export interface WisdomQuote {
    id: number;
    content: string;
    contributor?: string;
}

export const wisdomQuotes: WisdomQuote[] = [
    {
        id: 1,
        content: "Hit more good shots, less bad shots.",
        contributor: "Jerry",
    },
    {
        id: 2,
        content: "The fairway is your friend.",
        contributor: "Jerry",
    },
    {
        id: 3,
        content: "Hitting the ball in the center of your club face costs you nothing - do not be afraid to do it!",
        contributor: "Jerry",
    },
    {
        id: 4,
        content: "Practice does not make perfect. Perfect practice makes perfect.",
        contributor: "Jerry",
    },
    {
        id: 5,
        content: "The ball does not know how much you paid for your clubs.",
        contributor: "Jerry",
    },
];

export const getTotalPages = (): number => {
    // Title page + wisdom quotes + acknowledgements page
    return 1 + wisdomQuotes.length + 1;
};

export const getPageType = (pageIndex: number): 'title' | 'wisdom' | 'acknowledgements' => {
    if (pageIndex === 0) return 'title';
    if (pageIndex === getTotalPages() - 1) return 'acknowledgements';
    return 'wisdom';
};

export const getWisdomQuote = (pageIndex: number): WisdomQuote | null => {
    // Page 0 is title, pages 1-5 are wisdom, page 6 is acknowledgements
    const wisdomIndex = pageIndex - 1;
    if (wisdomIndex >= 0 && wisdomIndex < wisdomQuotes.length) {
        return wisdomQuotes[wisdomIndex];
    }
    return null;
};
