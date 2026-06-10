const fs = require('fs');
const path = require('path');

const directory = 'c:/Users/Admin/Downloads/id_card_generator/app';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(directory);

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Clean Banners (any bg-gradient-to-r from-... to-... p-6 or p-8 text-white relative)
  const bannerRegex = /className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[^"]+p-6 text-white[^"]*"/g;
  content = content.replace(bannerRegex, 'className="rounded-[20px] bg-primary p-6 text-white border-3 border-ink shadow-[8px_8px_0_#111111] relative overflow-hidden"');

  const bannerRegex2 = /className="rounded-2xl bg-gradient-to-r from-[^"]+p-6 text-white[^"]*"/g;
  content = content.replace(bannerRegex2, 'className="rounded-[20px] bg-primary p-6 text-white border-3 border-ink shadow-[8px_8px_0_#111111] relative overflow-hidden"');

  // Generic banner replacement for any gradient p-6 text-white
  const genericBannerRegex = /className="[^"]*bg-gradient-to-r from-[^"]+ p-6 text-white[^"]*"/g;
  content = content.replace(genericBannerRegex, 'className="rounded-[20px] bg-primary p-6 text-white border-3 border-ink shadow-[8px_8px_0_#111111] relative overflow-hidden"');

  // 2. Clean Button ClassNames
  // Remove gradients, shadow overrides, and rounded corners overrides from Buttons
  const buttonRegex = /(<Button[^>]*className=")([^"]+)(")/g;
  content = content.replace(buttonRegex, (match, p1, p2, p3) => {
    let classes = p2.split(' ');
    classes = classes.filter(c => {
      if (c.startsWith('bg-gradient-to-')) return false;
      if (c.startsWith('from-')) return false;
      if (c.startsWith('via-')) return false;
      if (c.startsWith('to-')) return false;
      if (c.startsWith('hover:from-')) return false;
      if (c.startsWith('hover:to-')) return false;
      if (c.startsWith('shadow-') && c !== 'shadow-hard') return false;
      if (c.startsWith('rounded-')) return false;
      if (c === 'font-semibold' || c === 'font-medium') return false;
      if (c.startsWith('border-') && c !== 'border-ink' && c !== 'border-3') return false;
      if (c.startsWith('text-indigo-') || c.startsWith('text-emerald-') || c.startsWith('text-purple-') || c.startsWith('text-teal-') || c.startsWith('text-rose-')) return false;
      return true;
    });
    return p1 + classes.join(' ').trim() + p3;
  });

  // 3. Clean Card ClassNames
  const cardRegex = /(<Card[^>]*className=")([^"]+)(")/g;
  content = content.replace(cardRegex, (match, p1, p2, p3) => {
    let classes = p2.split(' ');
    classes = classes.filter(c => {
      if (c.startsWith('border-') && c !== 'border-ink' && c !== 'border-3') return false;
      if (c.startsWith('shadow-') && c !== 'shadow-hard') return false;
      if (c.startsWith('hover:shadow-')) return false;
      if (c === 'transition-all' || c === 'duration-300' || c === 'transition-transform' || c === 'duration-150' || c.startsWith('hover:-translate-y-')) return false;
      return true;
    });
    return p1 + classes.join(' ').trim() + p3;
  });

  // 4. Clean Input ClassNames
  const inputRegex = /(<Input[^>]*className=")([^"]+)(")/g;
  content = content.replace(inputRegex, (match, p1, p2, p3) => {
    let classes = p2.split(' ');
    classes = classes.filter(c => {
      if (c.startsWith('border-') && c !== 'border-ink' && c !== 'border-3') return false;
      if (c.startsWith('shadow-')) return false;
      if (c.startsWith('rounded-')) return false;
      if (c === 'bg-card' || c === 'bg-transparent') return false;
      return true;
    });
    return p1 + classes.join(' ').trim() + p3;
  });

  // 5. Replace remaining header gradient text colors (e.g. text-purple-100 to text-white/80)
  content = content.replace(/text-(indigo|purple|teal|emerald|blue|pink|rose)-100/g, 'text-white/80');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Deep Updated: ${filePath}`);
  }
});

console.log('Style deep cleaning script completed!');
