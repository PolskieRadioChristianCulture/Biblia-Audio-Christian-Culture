import { extractUbgChapter } from '../src/lib/ubgService.ts';

async function test() {
  console.log('Testing Luke 15...');
  const lk15 = await extractUbgChapter('Łk', 15);
  console.log('Book:', lk15.book, 'Ch:', lk15.chapter, 'Chars:', lk15.charCount, 'Est. mins:', lk15.estimatedMinutes);
  console.log('First 300 chars:');
  console.log(lk15.text.slice(0, 300));
  console.log('---');

  console.log('Testing Genesis 1...');
  const rdz1 = await extractUbgChapter('Rdz', 1);
  console.log('Book:', rdz1.book, 'Ch:', rdz1.chapter, 'Chars:', rdz1.charCount);
  console.log('First 300 chars:');
  console.log(rdz1.text.slice(0, 300));
  console.log('---');

  console.log('Testing Revelation 22...');
  const obj22 = await extractUbgChapter('Apokalipsa św. Jana', 22);
  console.log('Book:', obj22.book, 'Ch:', obj22.chapter, 'Chars:', obj22.charCount);
  console.log('First 300 chars:');
  console.log(obj22.text.slice(0, 300));
}

test().catch(console.error);
