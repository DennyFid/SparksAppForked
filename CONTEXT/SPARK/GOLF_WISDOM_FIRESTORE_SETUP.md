# Golf Wisdom Firestore Setup

## Collection Structure

```
golfWisdom/
├── _metadata (document)
│   └── lastUpdated: Timestamp
└── (individual wisdom pages as documents)
    ├── page_001
    ├── page_002
    ├── page_003
    ├── page_004
    └── page_005
```

## Document Schema

### Metadata Document (`_metadata`)
```json
{
  "lastUpdated": Timestamp,
  "version": 1
}
```

### Wisdom Page Document
```json
{
  "id": 1,
  "content": "Hit more good shots, less bad shots.",
  "order": 1,
  "updatedAt": Timestamp
}
```

## Initial Data to Add

Use the Firebase Console to add these documents to the `golfWisdom` collection:

### Document ID: `_metadata`
```
lastUpdated: [Current Timestamp]
version: 1
```

### Document ID: `page_001`
```
id: 1
content: "Hit more good shots, less bad shots."
order: 1
updatedAt: [Current Timestamp]
```

### Document ID: `page_002`
```
id: 2
content: "The fairway is your friend."
order: 2
updatedAt: [Current Timestamp]
```

### Document ID: `page_003`
```
id: 3
content: "Hitting the ball in the center of your club face costs you nothing - do not be afraid to do it!"
order: 3
updatedAt: [Current Timestamp]
```

### Document ID: `page_004`
```
id: 4
content: "Practice does not make perfect. Perfect practice makes perfect."
order: 4
updatedAt: [Current Timestamp]
```

### Document ID: `page_005`
```
id: 5
content: "The ball does not know how much you paid for your clubs."
order: 5
updatedAt: [Current Timestamp]
```

## Firebase Console Steps

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `sparkopedia-330f6`
3. Navigate to Firestore Database
4. Click "Start collection"
5. Collection ID: `golfWisdom`
6. Add the `_metadata` document first
7. Then add each wisdom page document (`page_001` through `page_005`)

## Testing

After adding the data:
1. Open the app
2. Navigate to Golf Wisdom spark
3. Should see "Loading wisdom..." briefly
4. Then display the quotes from Firestore
5. Close and reopen - should load from cache instantly
6. Check console logs for confirmation

## Updating Content

To add new wisdom quotes:
1. Add new document to `golfWisdom` collection (e.g., `page_006`)
2. Update `_metadata.lastUpdated` to current timestamp
3. Next time app launches, it will detect update and sync new content

## Admin Access (Future)

Admin panel will allow:
- Adding new quotes
- Editing existing quotes
- Reordering quotes
- Deleting quotes
- All changes automatically update `_metadata.lastUpdated`
