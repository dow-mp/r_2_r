// import * as React from 'react';
import { useState, useEffect, useRef, useReducer, useCallback, Component, createRef, memo, useMemo } from 'react';
import axios from 'axios';
import styles from './App.module.css';
import styled from 'styled-components';
// importing check mark svg for use as button "text" to dismiss articles
import { ReactComponent as Check } from './check.svg';

// defining styled-components
const StyledContainer = styled.div`
  height: fit-content;
  width: 100vw;
  padding: 20px;
  background: #83a4d4;
  background: linear-gradient(to left, #b6fbff, #83a4d4);
  color: #171212;
`;

const StyledHeadlinePrimary = styled.h1`
  font-size: 48px;
  font-weight: 300;
  letter-spacing: 2px;
`;

const StyledItem = styled.li`
  display: flex;
  align-items: center;
  padding-bottom: 5px;
`;

const StyledColumn = styled.span`
  padding: 0 5px;
  white-space: nowrap;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  a {
    color: inherit;
  }
  width: ${(props) => props.width};
`;

const StyledButton = styled.button`
  background: transparent;
  border: 1px solid #171212;
  padding: 5px;
  cursor: pointer;
  transition: all 0.1s ease-in;
  &:hover {
    background: #171212;
    color: #ffffff;
  }
`;

const StyledButtonSmall = styled(StyledButton)`
  padding: 5px;
  // adding styling for when the button is hovered over
  &:hover {
    background-color: hotpink;
  }
`;

const StyledButtonLarge = styled(StyledButton)`
  padding: 10px;
  height: 30px;
  display: flex;
  align-items: center;
`;

const StyledSearchForm = styled.form`
  padding: 10px 0 20px 0;
  display: flex;
  align-items: center;  
`;

const StyledLabel = styled.label`
  border: 1px solid #171212;
  padding-left: 5px;
  padding-right: 5px;
  margin-right: 5px;
  font-size: 24px;
  border-radius: 5px;
  height: 30px;
`;

const StyledInput = styled.input`
  border: none;
  border-bottom: 1px solid #171212;
  background-color: transparent;
  margin-right: 5px;
  height: 30px;
  font-size: 24px;
`;


// actions for the useReducer dispatch functions which will instruct what type of action to perform based on the reducer function below - storiesReducer
const ACTIONS = {
  // SET_STORIES: "SET_STORIES",
  REMOVE_STORY: "REMOVE_STORY",
  STORIES_FETCH_INIT: "STORIES_FETCH_INIT",
  STORIES_FETCH_FAILURE: "STORIES_FETCH_FAILURE",
  STORIES_FETCH_SUCCESS: "STORIES_FETCH_SUCCESS",
}

// const initialStories = [
//   {
//     title: 'React',
//     url: 'https://reactjs.org',
//     author: 'Jordan Walke',
//     num_comments: 3,
//     points: 4,
//     objectID: 0,
//   },
//   {
//     title: 'Redux',
//     url: 'https://redux.js.org',
//     author: 'Dan Abramov, Andrew Clark',
//     num_comments: 2,
//     points: 5,
//     objectID: 1,
//   },
//   {
//     title: 'MongoDB',
//     url: 'https://mongo.db',
//     author: 'Someone',
//     num_comments: 5,
//     points: 3,
//     objectID: 2,
//   },
// ];

// const getAsyncStories = () => 
//   // shorthand version of promise:
//   // Promise.resolve({data: {stories: initialStories}})
//   new Promise((resolve, reject) =>
//       setTimeout(() => resolve({data: {stories: initialStories}}), 2000)
//       );

const API_ENDPOINT = 'http://hn.algolia.com/api/v1/search?query=';

// initiate building custom hook to encompass functionality of useState and useEffect hooks
// use generic parameters (instead of searchTerm/setSearchTerm) so that this hook can be resused as needed throughout the application
const useSemiPersistentState = (key, initialState) => {
  // initialize isMounted ref to allow side-effect below to run only on subsequent renders/re-renders and NOT on initial render
  const isMounted = useRef(false);

  const [value, setValue] = useState(
    localStorage.getItem(key) || initialState
  );
  // when the state of the value changes, re-setting the local storage to this new value using a side effect
  useEffect(() => {
    // 
    if(!isMounted.current) {
      // initially set ref to false, so this conditions evals true on the first render and toggles the current ref to true (from false), the second part of this side effect will not run on the first render
      isMounted.current = true;
    } else {
      // component re-renders and current ref is now true (as set in the first render) so the below code block/side effect WILL run on re-renders only
      localStorage.setItem(key, value);
    }
  }, [value, key]);
  return [value, setValue];
};

// reducer function for the useReducer hook
// this function takes in the current state and an action THEN based on the type of action the following instructions are carried out
const storiesReducer = (state, action) => {
  switch (action.type) {
    case  ACTIONS.STORIES_FETCH_INIT:
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case ACTIONS.STORIES_FETCH_SUCCESS:
      return {
        ...state,
        data: action.payload,
        isLoading: false,
        isError: false,
      };
    case ACTIONS.STORIES_FETCH_FAILURE:
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    case ACTIONS.REMOVE_STORY: 
      return {
        ...state,
        data: state.data.filter(
          // this filters in stories that do NOT match the story.objectID [each story is checked to determine if its object ID does NOT equal the passed in ID and if it passes this test, it is included ino the new shallow copy array]
          (story) => action.payload.objectID !== story.objectID
        ),
      };
    default: 
      throw new Error();
  }
};

const getSumComments = (stories) => {
  console.log('C');
  return stories.data.reduce(
    (result, value) => result + value.num_comments,
    0
  );
};

const App = () => {
  // using the custom hook created outside of the App component to store the searchTerm to local storage when it changes as well as supply the initial state of the searchTerm input field on visit to the site
  const [searchTerm, setSearchTerm] = useSemiPersistentState(
    'search',
    ''
  );

  const [url, setUrl] = useState(`${API_ENDPOINT}${searchTerm}`);

  // previously isLoading and isError were their own stateful variables, but here we merge them into useReducer hook to limit the chance of achieving an impossible state where data "isLoading" but the api returned an error - and therefore data could not possibly be loading
  const [stories, dispatchStories] = useReducer(storiesReducer, {data: [], isLoading: false, isError: false});

  const sumComments = useMemo(() => getSumComments(stories), 
    [stories]
  );

  // memoizing the callback handler function with useCallback hook - remove all fetching data logic from side effect below into its own stand alone function within the component
  const handleFetchStories = useCallback( async () => {
    // console.log('handleFetchStories implicitly changed')
    // if searchTerm does not exist, do nothing
    // if(!searchTerm) return;
    // dispatch the action noted to the storiesReducer function using the dispatch function - this returns state with changes to isLoading and isError as defined in the storiesReducer function above
    dispatchStories({ type: ACTIONS.STORIES_FETCH_INIT });

    // use the searchTerm appended to the end of the URL query to filter results on the client side
    try {
      const result = await axios.get(url)
      // console.log(result);
        // this dispatch function is returned from the useReducer hook and it sets the state based on the action.type - whose logic is carried out in the reducer function (if action is type: x, do z) ...in this instance, when data is returned from the promise, update the state of stories variable to include the payload and change isLoading and isError booleans as defined in the storiesReducer function
      dispatchStories({
        type: ACTIONS.STORIES_FETCH_SUCCESS,
        payload: result.data.hits,
      });
    } catch {
      console.log(Error);
      dispatchStories({ type: ACTIONS.STORIES_FETCH_FAILURE }); // dispatch the failure action type to the storiesReducer function to return state changes as defined in the function
    }
  }, [url]);
  
    // searchTerm in the dependecy above changes when the user enters input into the input field, this causes the function handleFetchStories to re-run and thus the side effect below runs because the function has been re-defined


  useEffect(() => {
    // console.log('side effect handleFetchStories runs')
    handleFetchStories();
  }, [handleFetchStories]); // this side effect is now dependent on changes to the callback function

  // add a callback handler function to App component to handle what happens when Search component renders - this function will be passed into Search component as props
  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value);
    // set local storage of 'search' item to be the event's target value (or the input field value on submit)
    // localStorage.setItem('search', e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setUrl(`${API_ENDPOINT}${searchTerm}`);
  };

  // eliminiating this variable and avoiding passing it as props allows us to switch from filtering our results on the client side to filtering the results on the server side using a query directly to the API
  // const searchedStories = stories.data.filter((story) => story.title.toLowerCase().includes(searchTerm.toLowerCase()));

  // create callback handler to remove a specific searched story
  // implement useCallback to allow memo functionality in the list component below (to create an equality check for the list component to avoid unncecessary re-renders - we need useCallback here to avoid creating a new version of this handler on each render of the app component which would then result in a new version of the list component since this is passed in as a prop)
  const handleRemoveStory = useCallback((item) => {
    // the following logic was relocated to the reducer function for use with useReducer hook for an action.type of 'remove_story'

    // const newStories = stories.filter(
    //   (story) => item.objectID !== story.objectID
    // );

    // dispatch the remove story action to the storiesReducer to run the logic above that was relocated to the reducer function in order create a new state of "data" that does not include stories where the ID matched the param ID (i.e. they are removed from the returned array value)
    dispatchStories({
      type: ACTIONS.REMOVE_STORY,
      payload: item,
    });
  }, []);

  console.log('B: App');
  return (
    // <div className="container">
    // implement css module (imports the css stylesheet as a module or Object which you can access different properties of the object using dot notaiton)
    // <div className={styles.container}>
    // implement styled-components (css directly inside of js)
    <StyledContainer>
      {/* <h1 className="headline-primary">My Hacker Stories</h1> */}
      {/* implement css module */}
      {/* <h1 className={styles.headlinePrimary}>My Hacker Stories</h1> */}
      <StyledHeadlinePrimary>My Hacker Stories with {sumComments} comments.</StyledHeadlinePrimary>
      <SearchForm
        searchTerm={searchTerm}
        onSearchInput={handleSearchInput}
        onSearchSubmit={handleSearchSubmit}
      />

      <hr />
      
      {stories.isError && <p>Something went wrong...</p>}

      { stories.isLoading ? <p>Loading....</p> : 
        <List 
          list={stories.data} 
          onRemoveItem={handleRemoveStory}
        />
      }

      {/* creating another instance of list element - practicing component instantiation */}
      {/* <List /> */}
    {/* </div> */}
    </StyledContainer>
  )
};

// pass in the props to the List component - we always pass in "props" because there may be several attributes or props passed into the component from the parent and we can access them by stating props._____ (the name of the attribute)
const eList = ({list, onRemoveItem}) => {
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

const List = memo(
  (props) => 
  // console.log('B: List') will always evaluate false, so the right-hand side of this operator will be executed (and the console will log what we want it to)
  console.log('B: List') || (
    <ul>
      {props.list.map((item) => ( 
          <Item 
            key={item.objectId}
            title={item.title}
            url={item.url}
            author={item.author}
            num_comments={item.num_comments}
            points={item.points}
            item={item}
            onRemoveItem={props.onRemoveItem}
          />
        )
      )}
    </ul>
  )
);

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
    // <li className="item">
    // implement css module
    // <li className={styles.item}>
    // implement styled list item
    <StyledItem>
      {/* <span style={{ width: '40%' }}> */}
      <StyledColumn>
        <a href={url}>{title}</a>
      {/* </span> */}
      </StyledColumn>
      {/* <span style={{ width: '30%' }}>{author}</span> */}
      <StyledColumn>{author}</StyledColumn>
      {/* <span style={{ width: '10%' }}>{num_comments}</span> */}
      <StyledColumn>{num_comments}</StyledColumn>
      {/* <span style={{ width: '10%' }}>{points}</span> */}
      <StyledColumn>{points}</StyledColumn>
      {/* <span style={{ width: '10%' }}> */}
      <StyledColumn>
        {/* passing the handler declared above to the button as a function that should execute onClick */}
        {/* <button type="button" onClick={handleRemoveItem}> */}
        {/* another option - create in inline handler which binds arguments to the function for execution of the function with those given arguments */}
        {/* <button type="button" onClick={onRemoveItem.bind(null, title, url, author, num_comments, points)}> */}
        {/* option 3 - an alternative inline handler function using an anonymous function to allow us to utilize the function with an argument */}
        {/* <button */}
        <StyledButtonSmall
          type="button"
          onClick={() => onRemoveItem(item)}
          // className="button button_small"
          // implement css module - requires string interpolation via template literal for multiple class names via dot notation
          // an alternative is the install and import the classnames library and use the following syntax: 
          // className={cs(styles.button, styles.buttonSmall)}
          // classnames library also allows for conditional styling - the left hand side of the object's property must be used as a computed property name and is only applied if the right-hand side evaluates true as follows:
          // className={cs(styles.button, { [styles.buttonLarge]: isLarge})}
          // className={`${styles.button} ${styles.buttonSmall}`}
        >
          <Check height="18px" width="18px" />
        {/* </button> */}
        </StyledButtonSmall>
      {/* </span> */}
      </StyledColumn>
    {/* </li> */}
    </StyledItem>
  )
}

// class InputWithLabel extends Component {
//   constructor(props) {
//     super(props);

//     this.inputRef = createRef();
//   }

//   componentDidMount() {
//     if(this.props.isFocused) {
//       this.inputRef?.current.focus();
//     }
//   }

//   render() {
//     const {
//       id,
//       value,
//       type="text",
//       onInputChange, 
//       children
//     } = this.props;
//      return (
//       <>
//         <label htmlFor={id}>{children}</label>
//         &nbsp;
//         <input
//           ref={this.inputRef}
//           id={id}
//           type={type}
//           value={value}
//           onChange={onInputChange}
//         />
//       </>
//      );
//   }
// }

const InputWithLabel = ({id, type='text', children, value, onInputChange, isFocused}) => {
  const inputRef = useRef();

  useEffect(() => {
    if(isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  return (
    <>
      {/* <label htmlFor={id} className="label">{children}</label> */}
      {/* <label htmlFor={id} className={styles.label}>{children}</label> */}
      {/* implement styled label component */}
      <StyledLabel htmlFor={id}>{children}</StyledLabel>
      &nbsp;
      {/* <input  */}
      {/* implement styled input component */}
      <StyledInput
        ref={inputRef}
        id={id} 
        type={type}
        value={value}
        autoFocus={isFocused}
        onChange={onInputChange}
        // className="input"
        // className={styles.input}
      />
    </>
  );
};

const SearchForm = ({ searchTerm, onSearchInput, onSearchSubmit }) => {
  return (
    // <form onSubmit={onSearchSubmit} className="search-form">      
    // <form onSubmit={onSearchSubmit} className={styles.searchForm}> 
    // implement styled search form component
    <StyledSearchForm onSubmit={onSearchSubmit}>
      <InputWithLabel
        id="search"
        value={searchTerm}
        isFocused
        onInputChange={onSearchInput}
      >
        <strong>Search: </strong>
      </InputWithLabel>

      {/* <button */}
      {/* implement large styled button */}
      <StyledButtonLarge
        type="submit"
        disabled={!searchTerm}
        // className="button button-large"
        // className={`${styles.button} ${styles.buttonLarge}`}
      >
        Submit
      {/* </button> */}
      </StyledButtonLarge>
    {/* </form> */}
    </StyledSearchForm>
  )
}

export default App;