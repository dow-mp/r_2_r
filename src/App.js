// import * as React from 'react';
import { useState, useEffect, useRef } from 'react';

const initialStories = [
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

  // previous use of useState and useEffect hooks prior to building custom hook
    /* const [searchTerm, setSearchTerm] = useState(
      localStorage.getItem('search') || 'React'
    );
    
    useEffect(() => { 
      localStorage.setItem('search', searchTerm);
    }, [searchTerm]); */

  const [searchTerm, setSearchTerm] = useSemiPersistentState(
    'search',
    ''
  );

  // initiate stateful stories array
  const [stories, setStories] = useState(initialStories);



  // add a callback handler function to App component to handle what happens when Search component renders - this function will be passed into Search component as props
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // set local storage of 'search' item to be the event's target value (or the input field value on submit)
    localStorage.setItem('search', e.target.value);
  };

  const searchedStories = stories.filter(function (story) {
    return story.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // create callback handler to remove a specific searched story
  const handleRemoveStory = (item) => {
    const newStories = stories.filter(
      (story) => item.objectID !== story.objectID
    );
    setStories(newStories);
  };



  return (
    <>
      <h1>My Hacker Stories</h1>

      {/* passing in the handleSearch callback handler function as props to the Search component */}
      <InputWithLabel
        id="search"
        value={searchTerm}
        isFocused
        onInputChange={handleSearch}
      >
        <strong>Search: </strong>
      </InputWithLabel>

      {/* testing autofocus feature with two input/label boxes */}
      <InputWithLabel
        id="input"
        value={searchTerm}
        onInputChange={handleSearch}
      >
        <strong>Input: </strong>
      </InputWithLabel>

      <hr />
      
      {/*utilize the List component within the App component*/}
      <List list={searchedStories} onRemoveItem={handleRemoveStory}/>

      {/* creating another instance of list element - practicing component instantiation */}
      {/* <List /> */}
    </>
  )
};

// pass in the props to the List component - we always pass in "props" because there may be several attributes or props passed into the component from the parent and we can access them by stating props._____ (the name of the attribute)
const List = ({ list, onRemoveItem }) => {
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
            item={item}
            onRemoveItem={onRemoveItem}
          />
        )
      )}
    </ul>
  )
};

const Item = ({title, url, author, num_comments, points, item, onRemoveItem}) => {
  // creating another handler function to call the function passed in as props from List which was passed down to list from App (this is a "normal handler")
  //const handleRemoveItem = () => {
    // in the book R2R, Robin passes 'item' from List by mapping several <Item> components per each item passed into the map function; but if I passed down each item's attributes separately as in {title, url, author, num_comments, points} how can I then pass these arguments to the onRemoveItem function for it to remove the affected HTML elements from view on the page??
    // from the book: 
    /* const Item = ({item, onRemoveItem}) => {
        return (
          <li>
            <span>
              <a href={item.url}>{item.title}</a>
            </span>
            <span>{item.author}</span>
            <span>{item.num_comments}</span>
            <span>{item.points}</span>
            <span>
              <button type="button" onClick={() => onRemoveItem(item)}> OR <button type="button" onClick={onRemoveItem.bind(null, item)}> OR <button type="button" onClick={handleRemoveItem}>
                Dismiss
              </button>  
            </span>
          </li>
        )
    }; */
   // onRemoveItem(title, url, author, num_comments, points);
 // }

  return (
    <li>
      <span>
        <a href={url}>{title}</a>
      </span>
      <span>{author}</span>
      <span>{num_comments}</span>
      <span>{points}</span>
      <span>
        {/* passing the handler declared above to the button as a function that should execute onClick */}
        {/* <button type="button" onClick={handleRemoveItem}> */}
        {/* another option - create in inline handler which binds arguments to the function for execution of the function with those given arguments */}
        {/* <button type="button" onClick={onRemoveItem.bind(null, title, url, author, num_comments, points)}> */}
        {/* option 3 - an alternative inline handler function using an anonymous function to allow us to utilize the function with an argument */}
        <button type="button" onClick={() => onRemoveItem(item)}>
          Dismiss
        </button>
      </span>
    </li>
  )
}

const InputWithLabel = ({id, type='text', children, value, onInputChange, isFocused}) => {
  const inputRef = useRef();

  useEffect(() => {
    if(isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  return (
    <>
      <label htmlFor={id}>{children}</label>
      &nbsp;
      <input 
        ref={inputRef}
        id={id} 
        type={type}
        value={value}
        autoFocus={isFocused}
        onChange={onInputChange}
      />
    </>
  );
};

export default App;