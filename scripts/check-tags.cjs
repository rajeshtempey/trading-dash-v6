const fs = require('fs');
const s = fs.readFileSync('client/src/pages/Dashboard.tsx','utf8');
const pairs = [
  ['<div', '</div>'],
  ['<main', '</main>'],
  ['<Tabs', '</Tabs>'],
  ['<TabsList', '</TabsList>'],
  ['<TabsContent', '</TabsContent>'],
  ['<TabsTrigger', '</TabsTrigger>'],
  ['<ScrollArea', '</ScrollArea>'],
];

for (const [o,c] of pairs) {
  const open = (s.split(o).length - 1);
  const close = (s.split(c).length - 1);
  console.log(o, 'open', open, 'close', close);
}
