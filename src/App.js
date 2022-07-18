// import * as React from 'react';
import { useState, useEffect } from 'react';

// initiate building custom hook to encompass functionality of useState and useEffect hooks
// use generic parameters (instead of searchTerm/setSearchTerm) so that this hook can be resused as needed throughout the application
const useSemiPersistentState = (key, initialState) => {
  const [value, setValue] = useState(
    localStorage.getItem(key) || initialState
  );

  useEffect(() => {
    localStorage.setItem(key, value);
  }, [value, key]);

  return [value, setValue];
};

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

  // previous use of useState and useEffect hooks prior to building custom hook
    /* const [searchTerm, setSearchTerm] = useState(
      localStorage.getItem('search') || 'React'
    );
    
    useEffect(() => { 
      localStorage.setItem('search', searchTerm);
    }, [searchTerm]); */

  const [searchTerm, setSearchTerm] = useSemiPersistentState(
    'search',
    'React'
  );

  // add a callback handler function to App component to handle what happens when Search component renders - this function will be passed into Search component as props
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // set local storage of 'search' item to be the event's target value (or the input field value on submit)
    localStorage.setItem('search', e.target.value);
  };

  const searchedStories = stories.filter(function (story) {
    return story.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <>
      <h1>My Hacker Stories</h1>

      {/* passing in the handleSearch callback handler function as props to the Search component */}
      <Search onSearch={handleSearch} search={searchTerm}/>

      <hr />
      
      {/*utilize the List component within the App component*/}
      <List list={searchedStories}/>

      {/* creating another instance of list element - practicing component instantiation */}
      {/* <List /> */}
    </>
  )
};

// pass in the props to the List component - we always pass in "props" because there may be several attributes or props passed into the component from the parent and we can access them by stating props._____ (the name of the attribute)
const List = ({ list }) => {
  console.log('List renders');
  return (
    <ul>
      {/* can create another component called Item to further simplify the list component and keep each function separate */}

      {/* could use rest operator here in the signature of the .map() function as such:  .map(({objectId, ...item}) => etc. etc.)    but this is not as readable for a beginner dev (any maybe not even for another dev unfamiliar with the project) */}
      {list.map((item) => ( 
          <Item // could use spread operator here: <Item key={objectId} {...item}   but this comes at a cost of readability
            // instead, have passed in all properties of the item object as props here and will use below in the <Item /> component as destructured properties that appear in the function siganature of <Item />
            key={item.objectId}
            title={item.title}
            url={item.url}
            author={item.author}
            num_comments={item.num_comments}
            points={item.points}
          />
        )
      )}
    </ul>
  )
};

const Item = ({title, url, author, num_comments, points}) => {
  return (
    // In the book, R2R, the key is not used here, but only passed in as props in the List component above - so is using the key in the list item here repetitive? since each item will have received it above?
    <li>
      <span>
        <a href={url}>{title}</a>
      </span>
      <span>{author}</span>
      <span>{num_comments}</span>
      <span>{points}</span>
    </li>
  )
}

const Search = ({search, onSearch}) => {
  //console.log('Search renders');

  return (
    <div>
      <label htmlFor="search">Search: </label>
      <input 
        id="search" 
        type="text"
        value={search}
        onChange={onSearch}
      />
    </div>
  );
};

export default App;


// Friday 7/8/22 Left off in Road to React advanced props handling (destructuring, etc.)