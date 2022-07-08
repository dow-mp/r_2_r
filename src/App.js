// import * as React from 'react';
import { useState } from 'react';

const App = () => {
  //console.log('App renders');
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
  // lifting state up from Search component to App component for use in all children components (currently, Search AND List)
  const [searchTerm, setSearchTerm] = useState('React');

  // add a callback handler function to App component to handle what happens when Search component renders - this function will be passed into Search component as props
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const searchedStories = stories.filter(function (story) {
    return story.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      <h1>My Hacker Stories</h1>

      {/* passing in the handleSearch callback handler function as props to the Search component */}
      <Search onSearch={handleSearch} search={searchTerm}/>

      <hr />
      
      {/*utilize the List component within the App component*/}
      <List list={searchedStories}/>

      {/* creating another instance of list element - practicing component instantiation */}
      {/* <List /> */}

    </div>
  )
};

// pass in the props to the List component - we always pass in "props" because there may be several attributes or props passed into the component from the parent and we can access them by stating props._____ (the name of the attribute)
const List = (props) => {
  console.log('List renders');
  return (
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
  )
};

const Search = (props) => {
  //console.log('Search renders');

  return (
    <div>
      <label htmlFor="search">Search: </label>
      <input 
        id="search" 
        type="text"
        value={props.search}
        onChange={props.onSearch}
      />
    </div>
  );
};

export default App;


// Friday 7/8/22 Left off in Road to React advanced props handling (destructuring, etc.)