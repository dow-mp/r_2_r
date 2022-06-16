import * as React from 'react';

const App = () => {
  const stories = [
    {
      title: 'React',
      url: 'https://reactjs.org',
      author: 'Jordan Walke',
      num_comments: 3,
      points: 4,
      objectID: 0,
    },
    {
      title: 'Redux',
      url: 'https://redux.js.org',
      author: 'Dan Abramov, Andrew Clark',
      num_comments: 2,
      points: 5,
      objectID: 1,
    },
    {
      title: 'MongoDB',
      url: 'https://mongo.db',
      author: 'Someone',
      num_comments: 5,
      points: 3,
      objectID: 2,
    },
  ];

  return (
    <div>
      <h1>My Hacker Stories</h1>

      <Search />

      <hr />
      
      {/*utilize the List component within the App component*/}
      <List list={stories}/>

      {/* creating another instance of list element - practicing component instantiation */}
      {/* <List /> */}

    </div>
  )
};

// pass in the props to the List component - we always pass in "props" because there may be several attributes or props passed into the component from the parent and we can access them by stating props._____ (the name of the attribute)
const List = (props) => (
    <ul>
      {props.list.map((item) => (
          <li key={item.objectID}>
            <span>
              <a href={item.url}>{item.title}</a>
            </span>
            <span>{item.author}</span>
            <span>{item.num_comments}</span>
            <span>{item.points}</span>
          </li>
        )
      )}
    </ul>
  );

const Search = () => {
  const handleChange = (e) => {
    // console.log(e) logs EVERY letter that gets added to the input field (i.e. every change made to the field)
    // console.log(e)
    
    // console.log(e.target.value) drills down to only log the specific character entered into the input field 
    //it continues to log each letter as a change event and therefore the console log looks like:
    // p
    // py
    // pyt
    // pyth
    // pytho
    // python
    console.log(e.target.value);
  }

  return (
    <div>
      <label htmlFor="search">Search: </label>
      <input id="search" type="text" onChange={handleChange} />
    </div>
  )
};

export default App;