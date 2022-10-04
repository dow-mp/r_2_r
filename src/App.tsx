import { useState, useEffect, useRef, useReducer, useCallback } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { ReactComponent as Check } from './check.svg';
import { sortBy } from 'lodash';

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

type ItemProps = {
  item: Story;
  onRemoveItem: (item: Story) => void;
};

type ListProps = {
  list: Stories;
  onRemoveItem: (item: Story) => void;
};

type StoriesState = {
  data: Stories;
  page: number;
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

const StyledContainer = styled.div`
  height: fit-content;
  width: 100vw;
  padding: 20px;
  background: #83a4d4;
  background: linear-gradient(to left, #b6fbff, #83a4d4);
  color: #171212;
`;

const StyledContainerSearch = styled.div`
  display: inline-block;
  padding: 10px 5px;
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
  REMOVE_STORY: "REMOVE_STORY",
  STORIES_FETCH_INIT: "STORIES_FETCH_INIT",
  STORIES_FETCH_FAILURE: "STORIES_FETCH_FAILURE",
  STORIES_FETCH_SUCCESS: "STORIES_FETCH_SUCCESS",
}

const API_BASE = 'http://hn.algolia.com/api/v1';
const API_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';

const API_ENDPOINT = 'http://hn.algolia.com/api/v1/search?query=';

// initiate building re-useable custom hook to encompass functionality of useState and useEffect hooks
const useSemiPersistentState = (
  key: string,
  initialState: string
): [string, (newValue: string) => void] => {
  const [value, setValue] = useState(
    localStorage.getItem(key) || initialState
  );

  useEffect(() => {
      localStorage.setItem(key, value);
    }, [value, key]);
  return [value, setValue];
};

// reducer function for the useReducer hook - takes in the current state and an action THEN based on the type of action the following instructions are carried out
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
        isLoading: false,
        isError: false,
        data: 
          action.payload.page === 0 
          ? action.payload.list
          : state.data.concat(action.payload.list),
        page: action.payload.page,

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


const extractSearchTerm = (url : string) => {
  return url
    .substring(url.lastIndexOf('?') + 1, url.lastIndexOf('&'))
    .replace(PARAM_SEARCH, '');
}

const getLastSearches = (urls : Array<string>) => {
  return urls.slice(-6).slice(0, -1).map(extractSearchTerm);
}

const getUrl = (searchTerm : string, page : number) => `${API_BASE}${API_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}`;

const App = () => {

  // using the custom hook created outside of the App component to store the searchTerm to local storage when it changes as well as supply the initial state of the searchTerm input field on visit to the site
  const [searchTerm, setSearchTerm] = useSemiPersistentState(
    'search',
    ''
  );

  const [urls, setUrls] = useState([getUrl(searchTerm, 0)]);

  const [stories, dispatchStories] = useReducer(
    storiesReducer, 
    { data: [],
      page: 0,
      isLoading: false,
      isError: false
    });

  // memoizing the callback handler function with useCallback hook - remove all fetching data logic from side effect below into its own stand alone function within the component
  const handleFetchStories = useCallback( async () => {
    dispatchStories({ type: ACTIONS.STORIES_FETCH_INIT });

    try {
      const lastUrl = urls[urls.length - 1];
      const result = await axios.get(lastUrl)
      console.log(result.data); // want to check the data structure out to determine how to type the properties
      dispatchStories({
        type: ACTIONS.STORIES_FETCH_SUCCESS,
        payload: {
          list: result.data.hits,
          page: result.data.page,
        }
      });
    } catch {
      console.log(Error);
      dispatchStories({ type: ACTIONS.STORIES_FETCH_FAILURE }); // dispatch the failure action type to the storiesReducer function to return state changes as defined in the function
    }
  }, [urls]);

  // re-fetch the data from the API if the function changes (i.e. if a new search term results in the the API being pinged for hits again)
  useEffect(() => {
    handleFetchStories();
  }, [handleFetchStories]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = (searchTerm : string, page : number) => {
    const url = getUrl(searchTerm, page);
    setUrls(urls.concat(url));
  }

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    return handleSearch(searchTerm, 0);
  };

  const handleRemoveStory = useCallback((item: Story) => {
    dispatchStories({
      type: ACTIONS.REMOVE_STORY,
      payload: item,
    });
  }, []);

  const handleLastSearch = (searchTerm : string) => {
    setSearchTerm(searchTerm);
    return handleSearch(searchTerm, 0);
  };

  const lastSearches = getLastSearches(urls);

  const handleMore = () => {
    const lastUrl = urls[urls.length - 1];
    const searchTerm = extractSearchTerm(lastUrl);
    return handleSearch(searchTerm, stories.page + 1);
  };

  return (
    <StyledContainer>
      <>
        <StyledHeadlinePrimary>My Hacker Stories</StyledHeadlinePrimary>
        <SearchForm
          searchTerm={searchTerm}
          onSearchInput={handleSearchInput}
          onSearchSubmit={handleSearchSubmit}
        />
        {lastSearches.map((searchTerm, index) => (
          <StyledContainerSearch>
            <StyledButtonLarge 
              key={searchTerm + index}
              type="button"
              onClick={() => handleLastSearch(searchTerm)}
              >
                {searchTerm}
            </StyledButtonLarge>
          </StyledContainerSearch>
        ))}

        <hr />
        {stories.isError && <p>Something went wrong...</p>}

        <List 
            list={stories.data} 
            onRemoveItem={handleRemoveStory}
          />


        { stories.isLoading 
          ? <p>Loading....</p> 
          : <StyledButtonLarge type="button" onClick={handleMore}>
              More
            </StyledButtonLarge>
        }

      </>
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

const Item = ({ item, onRemoveItem }: ItemProps) => {
  return (
    <StyledItem>

      <StyledColumnTitle>
        <a href={item.url}>{item.title}</a>
      </StyledColumnTitle>

      <StyledColumnAuthor>{item.author}</StyledColumnAuthor>
      <StyledColumnAuthor>{new Date(item.created_at).toDateString().split(' ').slice(1).join(' ')}</StyledColumnAuthor>
      <StyledColumnComments>{item.num_comments}</StyledColumnComments>
      <StyledColumnPoints>{item.points}</StyledColumnPoints>

      <StyledColumnActions>
        <StyledButtonSmall
          type="button"
          onClick={() => onRemoveItem(item)}
        >
          <Check height="18px" width="18px" />
        </StyledButtonSmall>
      </StyledColumnActions>

    </StyledItem>
  )
}

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
      <StyledLabel htmlFor={id}>{children}</StyledLabel>
      &nbsp;
      <StyledInput
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

const SearchForm = ({
  searchTerm,
  onSearchInput,
  onSearchSubmit 
}: SearchFormProps ) => {
  return (
    <StyledSearchForm onSubmit={onSearchSubmit}>
      <InputWithLabel
        id="search"
        value={searchTerm}
        isFocused
        onInputChange={onSearchInput}
      >
        <strong>Search: </strong>
      </InputWithLabel>

      <StyledButtonLarge
        type="submit"
        disabled={!searchTerm}
      >
        Submit
      </StyledButtonLarge>
    </StyledSearchForm>
  )
}

export default App;