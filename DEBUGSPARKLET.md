# Debug Sparklet

Paste the problematic Sparklet JSON definition below within the code block.

```json
{
  "metadata": {
    "title": "Memory Game",
    "icon": "🧠",
    "description": "Test your memory skills by matching pairs of images!",
    "category": "Game"
  },
  "initialState": {
    "cards": [],
    "flippedCards": [],
    "matchesFound": 0,
    "turns": 0,
    "gameStatus": "start",
    "totalPairs": 8,
    "cardSymbolsPool": ["🍎", "🚀", "💡", "🎉", "🎁", "💖", "🌈", "🎵", "🌟", "📚", "✏️", "🔬", "🧪", "🧬", "🦠", "🌐"]
  },
  "helpers": {
    "shuffleArray": "const array = params; for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array;"
  },
  "actions": {
    "initGame": "const totalPairs = state.totalPairs; const selectedSymbols = state.cardSymbolsPool.slice(0, totalPairs); let symbolsForGame = [...selectedSymbols, ...selectedSymbols]; symbolsForGame = helpers.shuffleArray(symbolsForGame); const newCards = symbolsForGame.map((symbol, index) => ({ id: index, symbol: symbol, isFlipped: false, isMatched: false })); return { ...state, cards: newCards, flippedCards: [], matchesFound: 0, turns: 0, gameStatus: 'playing' };",
    "flipCard": "if (state.gameStatus !== 'playing') return state; const cardId = params.cardId; const newCards = state.cards.map(card => ({ ...card })); const clickedCardIndex = newCards.findIndex(c => c.id === cardId); if (clickedCardIndex === -1) return state; const clickedCard = newCards[clickedCardIndex]; if (clickedCard.isMatched || state.flippedCards.includes(cardId)) return state; let newFlippedCards = [...state.flippedCards]; let newMatchesFound = state.matchesFound; let newTurns = state.turns; let newGameStatus = state.gameStatus; if (newFlippedCards.length === 2) { const [id1, id2] = newFlippedCards; const c1 = newCards.find(c => c.id === id1); const c2 = newCards.find(c => c.id === id2); if (!c1.isMatched) { c1.isFlipped = false; c2.isFlipped = false; } newFlippedCards = []; } clickedCard.isFlipped = true; newFlippedCards.push(cardId); if (newFlippedCards.length === 2) { newTurns++; const [id1, id2] = newFlippedCards; const c1 = newCards.find(c => c.id === id1); const c2 = newCards.find(c => c.id === id2); if (c1.symbol === c2.symbol) { c1.isMatched = true; c2.isMatched = true; newMatchesFound++; newFlippedCards = []; if (newMatchesFound === state.totalPairs) newGameStatus = 'won'; } } return { ...state, cards: newCards, flippedCards: newFlippedCards, matchesFound: newMatchesFound, turns: newTurns, gameStatus: newGameStatus };",
    "resetGame": "return { ...state, cards: [], flippedCards: [], matchesFound: 0, turns: 0, gameStatus: 'start' };"
  },
  "view": {
    "elements": [
      {
        "type": "text",
        "value": "Memory Game 🧠",
        "style": "heading"
      },
      {
        "type": "button",
        "label": "Start New Game",
        "onPress": "initGame",
        "style": "primaryButton",
        "hidden": "{{state.gameStatus === 'playing'}}"
      },
      {
        "type": "grid",
        "dataSource": "state.cards",
        "style": "gameGrid",
        "hidden": "{{state.gameStatus !== 'playing' && state.gameStatus !== 'won'}}",
        "elements": [
          {
            "type": "button",
            "value": "{{element.isFlipped || element.isMatched ? element.symbol : '?'}}",
            "onPress": "flipCard",
            "params": {
              "cardId": "{{element.id}}"
            },
            "style": "{{element.isMatched ? 'matchedCard' : (element.isFlipped ? 'flippedCard' : 'unflippedCard')}}"
          }
        ]
      },
      {
        "type": "text",
        "value": "Turns: {{state.turns}} | Matches: {{state.matchesFound}} / {{state.totalPairs}}",
        "style": "statusText",
        "hidden": "{{state.gameStatus === 'start'}}"
      },
      {
        "type": "text",
        "value": "🎉 Congratulations! You won!",
        "style": "winMessage",
        "visible": "{{state.gameStatus === 'won'}}"
      },
      {
        "type": "button",
        "label": "Play Again",
        "onPress": "resetGame",
        "style": "secondaryButton",
        "visible": "{{state.gameStatus === 'won'}}"
      }
    ],
    "styles": {
      "heading": {
        "fontSize": 32,
        "textAlign": "center",
        "marginBottom": 10
      },
      "primaryButton": {
        "backgroundColor": "#4CAF50",
        "paddingHorizontal": 20,
        "paddingVertical": 12,
        "borderRadius": 8,
        "marginBottom": 20
      },
      "gameGrid": {
        "flexDirection": "row",
        "flexWrap": "wrap",
        "justifyContent": "center",
        "width": "100%"
      },
      "statusText": {
        "textAlign": "center",
        "fontSize": 18,
        "marginTop": 20,
        "fontWeight": "bold"
      },
      "unflippedCard": {
        "backgroundColor": "#2196F3",
        "width": 70,
        "height": 70,
        "margin": 5,
        "borderRadius": 8,
        "fontSize": 24
      },
      "flippedCard": {
        "backgroundColor": "#fff",
        "width": 70,
        "height": 70,
        "margin": 5,
        "borderRadius": 8,
        "fontSize": 32,
        "borderColor": "#2196F3",
        "borderWidth": 2
      },
      "matchedCard": {
        "backgroundColor": "#8BC34A",
        "width": 70,
        "height": 70,
        "margin": 5,
        "borderRadius": 8,
        "fontSize": 32,
        "opacity": 0.6
      }
    }
  }
}
```

## Error Observed
Nothing happens when I click start new game

## Description
Fixed the Memory Game JSON by:
1. Moving `shuffleArray` to the `helpers` block.
2. Stripping arrow function wrappers from `actions`.
3. Standardizing styles for React Native (numbers instead of `em`).
4. Upgraded the engine to support grid templates and `element` context variables.