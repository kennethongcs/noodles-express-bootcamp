import express from 'express';
import { add, read } from './jsonFileStorage.js';

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));

// configure express to parse request body data into request.body
app.use(express.urlencoded({ extended: false }));

app.get('/recipe', (req, res) => {
  res.render('recipe');
});

// basic - POCE 2
// save new recipe data sent via POST request from the form
app.post('/recipe', (req, res) => {
  add('data.json', 'recipes', req.body, (err) => {
    if (err) {
      res.status(500).send('DB write error');
      return;
    }
    // acknowledge recipe saved
    res.send('Saved recipe!');
  });
});

// comfortable - POCE 2
app.get('/', (req, res) => {
  read('data.json', (err, content) => {
    if (err) {
      console.log('Read error', err);
    }
    // get array of recipes
    const { recipes } = content;
    // filter out those recipes without categories
    const filteredRecipes = recipes.filter((recipe) => {
      return recipe['category'];
    });
    // add categories into an array
    const categoryAll = filteredRecipes.map((recipe) => {
      if (recipe.category) {
        return recipe.category;
      }
    });
    console.log(categoryAll);
    // set creates an obj, spread the obj and encase in array
    const categoryAllNoDupes = [...new Set(categoryAll)];
    // add obj to array for it to pass correctly to ejs
    res.render('index', { categoryAllNoDupes });
  });
});

app.get('/category/:categories', (req, res) => {
  const category = req.params.categories;
  read('data.json', (err, content) => {
    const { recipes } = content;
    if (err) {
      console.log('Read error', err);
    }
    // list filtered by category
    const filteredList = recipes.filter((recipe) => {
      if (recipe.category === category) {
        return recipe.category;
      }
    });
    res.render('category', { filteredList });
  });
});

app.get('/recipe/:label', (req, res) => {
  const { label } = req.params;
  read('data.json', (err, content) => {
    // filter file that matches label
    const filteredList = content['recipes'].filter((recipe) => {
      const newLabel = recipe.label.replace(/ /g, '').toLowerCase();
      if (newLabel === label) {
        return recipe.label;
      }
    });
    res.render('recipes', { filteredList });
  });
});

// app.get('/recipe/:index', (req, res) => {
//   // get index number from browser req
//   const index = req.params.index;
//   read('data.json', (err, content) => {
//     if (err) {
//       console.log('Read Error', err);
//     }
//     if (content.recipes[index]) {
//       res.send(content.recipes[index]);
//     } else {
//       res.status(404).send('We cannot find that.');
//     }
//   });
// });

/**
 * returns based on recipe label
 */
app.get('/recipe-label/:label', (req, res) => {
  // get index number from browser req
  const { label } = req.params;
  // replace '-' from LABEL to spaces
  const labelCorrected = label.replaceAll('-', ' ');
  read('data.json', (err, content) => {
    if (err) {
      console.log('Read Error', err);
    }
    const recipes = content.recipes;
    const filteredRecipes = recipes.filter((recipe) => {
      return recipe['label'].toLowerCase() === labelCorrected;
    });
    let output = '';
    // add the recipe into OUTPUT
    filteredRecipes.forEach((recipe) => {
      for (let [key, value] of Object.entries(recipe)) {
        output += `${key.toUpperCase()}: `;
        output += `${value}<br>`;
      }
      output += `---<br>`;
    });
    res.send(output);
  });
});

/**
 * returns based on yield number
 */
app.get('/yield/:number', (req, res) => {
  // get index number from browser req
  console.log(`Incoming request..`);
  // convert param to number
  const { number } = req.params;
  read('data.json', (err, content) => {
    if (err) {
      console.log('Read Error', err);
    }
    // get the array from recipe obj
    const recipes = content.recipes;
    // filter the arrays that meet the NUMBER criteria
    const filteredArray = recipes.filter((recipe) => {
      return recipe.yield === Number(number);
    });
    // sends a different message if yield is not found
    if (filteredArray.length === 0) {
      res.status(404).send(`Yield ${number} not found.`);
    } else {
      let output = '';
      output += `<h2>Recipes with yield of ${number}:<br></h2>`;
      filteredArray.forEach((recipe) => {
        output += `Source: ${recipe.source}<br>`;
        output += `Label: ${recipe.label}<br>`;
        output += `----<br>`;
      });
      content = `
        <html>
          <body>
            <h1>Recipes</h1>
            ${output}<br/>
          </body>
        </html>
      `;
      res.send(content);
    }
  });
});

app.listen(3004, () => {
  console.log(`Listening on port 3004`);
});
