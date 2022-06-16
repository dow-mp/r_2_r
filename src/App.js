import * as React from 'react';

const App = () => {
  console.log('App renders');
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

  // add a callback handler function to App component to handle what happens when Search component renders - this function will be passed into Search component as props
  const handleSearch = (e) => {
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
  };

  return (
    <div>
      <h1>My Hacker Stories</h1>

      {/* passing in the handleSearch callback handler function as props to the Search component */}
      <Search onSearch={handleSearch}/>

      <hr />
      
      {/*utilize the List component within the App component*/}
      <List list={stories}/>

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
  console.log('Search renders');
  let [searchTerm, setSearchTerm] = React.useState('');
  const handleChange = (e) => {
    setSearchTerm(e.target.value);
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
    // console.log(e.target.value);

    // add a call to the callback handler function that was passed in as props from parent component <App/>
    props.onSearch(e);
  };

  return (
    <div>
      <label htmlFor="search">Search: </label>
      <input id="search" type="text" onChange={handleChange}/>
      <p> Searching for <strong> {searchTerm} </strong>.</p>
    </div>
  );
};

export default App;