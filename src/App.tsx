// import * as React from 'react';
import { useState, useEffect, useRef, useReducer, useCallback } from 'react';
import axios from 'axios';
// import styles from './App.module.css';
import styled from 'styled-components';
// // importing check mark svg for use as button "text" to dismiss articles
import { ReactComponent as Check } from './check.svg';
import { sortBy } from 'lodash';


// defining a Story type for use in the Item component in order to keep code DRY
type Story = {
  objectID: string;
  title?: string;
  url?: string;
  author?: string;
  created_at: string;
  num_comments?: number;
  points?: number;
};

type Stories = Array<Story>;

// we can even simplify things further by typing the ItemProps as below
type ItemProps = {
  item: Story;
  onRemoveItem: (item: Story) => void;
};

// pre-defining the types for props passed into the List component
type ListProps = {
  list: Stories;
  onRemoveItem: (item: Story) => void;
};

// adding types for states, actions below
type StoriesState = {
  data: Stories;
  isLoading: boolean;
  isError: boolean;
};

// commenting out because of a problem with the dispatch function and the number of arguments
// interface StoriesFetchInitAction {
//   type: 'STORIES_FETCH_INIT';
//   payload: Stories;
// }

// interface StoriesFetchSuccessAction {
//   type: 'STORIES_FETCH_SUCCESS';
//   payload: Stories;
// }

// interface StoriesFetchFailureAction {
//   type: 'STORIES_FETCH_FAILURE';
//   payload: Stories;
// }

// interface StoriesRemoveAction {
//   type: 'REMOVE_STORY';
//   payload: Story;
// }

// type StoriesAction = 
//   | StoriesFetchInitAction
//   | StoriesFetchSuccessAction
//   | StoriesFetchFailureAction
//   | StoriesRemoveAction;

type InputWithLabelProps = {
  id: string;
  value: string;
  type?: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isFocused?: boolean;
  children: React.ReactNode;
};

type SearchFormProps = {
  searchTerm: string;
  onSearchInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}


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

`;

const StyledColumnTitle = styled.span`
  width: 40%;
  padding: 0 5px;
  white-space: nowrap;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  a {
    color: inherit;
  }
`;

const StyledColumnAuthor = styled.span`
  width: 30%;
  padding: 0 5px;
  white-space: nowrap;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  a {
    color: inherit;
  }
`;

const StyledColumnDate = styled.span`
  width: 10%;
  min-width: 100px;
  padding: 0 5px;
  white-space: nowrap;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  a {
    color: inherit;
  }
`;

const StyledColumnComments = styled.span`
  width: 10%;
  min-width: 100px;
  padding: 0 5px;
  white-space: nowrap;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  a {
    color: inherit;
  }
`;

const StyledColumnPoints = styled.span`
  width: 10%;
  padding: 0 5px;
  white-space: nowrap;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  a {
    color: inherit;
  }
`;

const StyledColumnActions = styled.span`
  width: 10%;
  padding: 0 5px;
  white-space: nowrap;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  a {
    color: inherit;
  }
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

const API_ENDPOINT = 'http://hn.algolia.com/api/v1/search?query=';

// initiate building custom hook to encompass functionality of useState and useEffect hooks
// use generic parameters (instead of searchTerm/setSearchTerm) so that this hook can be resused as needed throughout the application
const useSemiPersistentState = (
  // add type safety for the arguments key and initialState using TypeScript
  key: string,
  initialState: string
  // below corresponds to the return value at the bottom of this hook; telling typescript that this function returns an [array] containing a string (the state value) and that the setState function returns nothing (void)
): [string, (newValue: string) => void] => {
  // we do not need to add additional type safety features below because of React and Typescript working together with type inference (i.e. if the initial state is a string, then the returned current state will be returned as a string and the updater function will only accept a string and return nothing)
  const [value, setValue] = useState(
    // value is inferred to be a string
    // setValue only takes a string as an argument 2' type inference
    localStorage.getItem(key) || initialState
  );
  // when the state of the value changes, re-setting the local storage to this new value using a side effect
  useEffect(() => {
      localStorage.setItem(key, value);
    }, [value, key]);
  return [value, setValue];
};

// reducer function for the useReducer hook
// this function takes in the current state and an action THEN based on the type of action the following instructions are carried out
const storiesReducer = (
  state: StoriesState,
  action: any,
  ) => {
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

const App = () => {

  // using the custom hook created outside of the App component to store the searchTerm to local storage when it changes as well as supply the initial state of the searchTerm input field on visit to the site
  const [searchTerm, setSearchTerm] = useSemiPersistentState(
    'search',
    ''
  );

  const [url, setUrl] = useState(`${API_ENDPOINT}${searchTerm}`);

  // previously isLoading and isError were their own stateful variables, but here we merge them into useReducer hook to limit the chance of achieving an impossible state where data "isLoading" but the api returned an error - and therefore data could not possibly be loading
  const [stories, dispatchStories] = useReducer(
    storiesReducer, 
    { data: [],
      isLoading: false,
      isError: false
    });

  // memoizing the callback handler function with useCallback hook - remove all fetching data logic from side effect below into its own stand alone function within the component
  const handleFetchStories = useCallback( async () => {
    // if searchTerm does not exist, do nothing
    // if(!searchTerm) return;
    // dispatch the action noted to the storiesReducer function using the dispatch function - this returns state with changes to isLoading and isError as defined in the storiesReducer function above
    dispatchStories({ type: ACTIONS.STORIES_FETCH_INIT });

    // use the searchTerm appended to the end of the URL query to filter results on the client side
    try {
      const result = await axios.get(url)
        // this dispatch function is returned from the useReducer hook and it sets the state based on the action.type - whose logic is carried out in the reducer function (if action is type: x, do z) ...in this instance, when data is returned from the promise, update the state of stories variable to include the payload and change isLoading and isError booleans as defined in the storiesReducer function
        console.log(result.data.hits);
      dispatchStories({type: ACTIONS.STORIES_FETCH_SUCCESS, payload: result.data.hits,});
    } catch {
      console.log(Error);
      dispatchStories({ type: ACTIONS.STORIES_FETCH_FAILURE }); // dispatch the failure action type to the storiesReducer function to return state changes as defined in the function
    }
  }, [url]);
  
    // searchTerm in the dependecy above changes when the user enters input into the input field, this causes the function handleFetchStories to re-run and thus the side effect below runs because the function has been re-defined


  useEffect(() => {
    handleFetchStories();
  }, [handleFetchStories]); // this side effect is now dependent on changes to the callback function

  // add a callback handler function to App component to handle what happens when Search component renders - this function will be passed into Search component as props
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // set local storage of 'search' item to be the event's target value (or the input field value on submit)
    // localStorage.setItem('search', e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUrl(`${API_ENDPOINT}${searchTerm}`);
  };

  // eliminiating this variable and avoiding passing it as props allows us to switch from filtering our results on the client side to filtering the results on the server side using a query directly to the API
  // const searchedStories = stories.data.filter((story) => story.title.toLowerCase().includes(searchTerm.toLowerCase()));

  // create callback handler to remove a specific searched story
  // implement useCallback to allow memo functionality in the list component below (to create an equality check for the list component to avoid unncecessary re-renders - we need useCallback here to avoid creating a new version of this handler on each render of the app component which would then result in a new version of the list component since this is passed in as a prop)
  const handleRemoveStory = useCallback((item: Story) => {
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

  return (
    // <div className="container">
    // implement css module (imports the css stylesheet as a module or Object which you can access different properties of the object using dot notaiton)
    // <div className={styles.container}>
    // implement styled-components (css directly inside of js)
    <StyledContainer>
      {/* <h1 className="headline-primary">My Hacker Stories</h1> */}
      {/* implement css module */}
      {/* <h1 className={styles.headlinePrimary}>My Hacker Stories</h1> */}
      <StyledHeadlinePrimary>My Hacker Stories</StyledHeadlinePrimary>
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

const SORTS : SortStates = {
  NONE: (list: Stories) => list,
  TITLE: (list: Stories) => sortBy(list, 'title'),
  AUTHOR: (list: Stories) => sortBy(list, 'author'),
  DATE: (list: Stories) => sortBy(list, 'created_at'),
  COMMENTS: (list: Stories) => sortBy(list, 'num_comments').reverse(),
  POINTS: (list: Stories) => sortBy(list, 'points').reverse(),
};

interface SortStates {
  NONE: Function;
  TITLE: Function;
  AUTHOR: Function;
  DATE: Function;
  COMMENTS: Function;
  POINTS: Function;
}

const List = ({list, onRemoveItem}: ListProps) => {
  
  const [sort, setSort] = useState({
    // implement an object to track the state of whether or not the column is sorted in ascending or descending order
    sortKey: 'NONE',
    isReverse: false,
  });

  const handleSort = (sortKey: string) => {
    // comparing the sortKey param with the sortKey in state (sort.sortKey) to determine if they are the same (if same, then it should reverse - but only if not already reversed)
    const isReverse = sort.sortKey === sortKey && !sort.isReverse;
    // setSort({ sortKey: sortKey, isReverse: isReverse });
    // implement shorthand object initializer notation
    setSort({ sortKey: sortKey, isReverse: isReverse });
  };

  const sortFunction = SORTS[sort.sortKey as keyof typeof SORTS];
  const sortedList = sort.isReverse 
    ? sortFunction(list).reverse() 
    : sortFunction(list);

  return (
    <ul>
      <StyledItem>
        <StyledColumnTitle>
          <StyledButtonLarge type="button" onClick={() => {handleSort("TITLE")}}>
            Title
          </StyledButtonLarge>
        </StyledColumnTitle>
        <StyledColumnAuthor>
          <StyledButtonLarge type="button" onClick={() => {handleSort("AUTHOR")}}>
            Author
          </StyledButtonLarge>
        </StyledColumnAuthor>
        <StyledColumnDate>
          <StyledButtonLarge type="button" onClick={() => {handleSort("DATE")}}>
            Date
          </StyledButtonLarge>
        </StyledColumnDate>
        <StyledColumnComments>          
          <StyledButtonLarge type="button" onClick={() => {handleSort("COMMENTS")}}>
            Comments
          </StyledButtonLarge>
        </StyledColumnComments>
        <StyledColumnPoints>
          <StyledButtonLarge type="button" onClick={() => {handleSort("POINTS")}}>
            Points
          </StyledButtonLarge>
        </StyledColumnPoints>
        <StyledColumnActions>
            Actions
        </StyledColumnActions>
      </StyledItem>

      {sortedList.map((item: Story) => ( 
          <Item 
            item={item}
            onRemoveItem={onRemoveItem}
          />
        )
      )}
    </ul>
  )
};

const Item = ({item, onRemoveItem
  // typing he passed in props as ItemProps (which are pre-typed above this component)
}: ItemProps
// {
  // typing below is not DRY code because it has been duplicated, instead we can define a type outside of this component and then use it here
  // item: {
  //   objectID: string;
  //   title: string;
  //   url: string;
  //   author: string;
  //   num_comments: number;
  //   points: number;
  // };
  // onRemoveItem: (item: {
  //   objectID: string;
  //   title: string;
  //   url: string;
  //   author: string;
  //   num_comments: number;
  //   points: number;
  //   }) => void;  

  // utilizing the pre-defined type Story here to keep code DRY; and then simplifying even further by defining ItemProps outside of this component and instituting above
  // item: Story;
  // onRemoveItem: (item: Story) => void;
) => {
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
      <StyledColumnTitle>
        <a href={item.url}>{item.title}</a>
      {/* </span> */}
      </StyledColumnTitle>
      {/* <span style={{ width: '30%' }}>{author}</span> */}
      <StyledColumnAuthor>{item.author}</StyledColumnAuthor>
      <StyledColumnAuthor>{new Date(item.created_at).toDateString().split(' ').slice(1).join(' ')}</StyledColumnAuthor>
      {/* <span style={{ width: '10%' }}>{num_comments}</span> */}
      <StyledColumnComments>{item.num_comments}</StyledColumnComments>
      {/* <span style={{ width: '10%' }}>{points}</span> */}
      <StyledColumnPoints>{item.points}</StyledColumnPoints>
      {/* <span style={{ width: '10%' }}> */}
      <StyledColumnActions>
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
      </StyledColumnActions>
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

const InputWithLabel = ({
  id,
  type='text',
  children,
  value,
  onInputChange,
  isFocused
}: InputWithLabelProps ) => {
  const inputRef = useRef<HTMLInputElement>(null!);

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

const SearchForm = ({
  searchTerm,
  onSearchInput,
  onSearchSubmit 
}: SearchFormProps ) => {
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