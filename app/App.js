import 'react-native-gesture-handler';
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

// logged out
import Login from './screens/Login';
import Register from './screens/Register';

// logged in
import Home from './screens/Home';
import Profile from './screens/Profile';
import AsyncStorage from '@react-native-community/async-storage';

import AuthContext from './AuthContext';
import Loading from './screens/Loading';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const initalState = {
  isLoading: true,
  isLoggedIn: false,
  userToken: null,
};

const reducer = (prevState, action) => {
  switch (action.type) {
    case 'RESTORE_TOKEN_SUCCESS':
      return {
        ...prevState,
        userToken: action.token,
        isLoading: false,
        isLoggedIn: true,
      };
    case 'RESTORE_TOKEN_FAILURE':
      return {
        ...prevState,
        isLoading: false,
        isLoggedIn: false,
      };
    case 'SIGN_IN':
      return {
        ...prevState,
        userToken: action.token,
        isLoggedIn: true,
      };
    case 'SIGN_OUT':
      return {
        ...prevState,
        userToken: null,
        isLoggedIn: false,
      };
  }
};

function App() {
  const [state, dispatch] = React.useReducer(reducer, initalState);

  console.log('State', state);

  React.useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken;
      try {
        userToken = await AsyncStorage.getItem('token');
        console.log('Effect', userToken);
      } catch (e) {
        // error fetching token
      }

      if (userToken) {
        dispatch({type: 'RESTORE_TOKEN_SUCCESS', token: userToken});
      } else {
        dispatch({type: 'RESTORE_TOKEN_FAILURE'});
      }
    };
    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async (email, password) => {
        const response = await fetch('http://10.0.2.2:3000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          await AsyncStorage.setItem('token', data.token);
          dispatch({type: 'SIGN_IN', token: data.token});
        }
      },
      signOut: async () => {
        await AsyncStorage.removeItem('token');
        dispatch({type: 'SIGN_OUT'});
      },
      signUp: async (username, email, password) => {},
      userToken: state.userToken,
    }),
    [state.userToken],
  );

  if (state.isLoading) {
    return <Loading />;
  }

  return (
    <NavigationContainer>
      <AuthContext.Provider value={authContext}>
        {!state.isLoggedIn ? (
          <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
          </Stack.Navigator>
        ) : (
          <Tab.Navigator>
            <Tab.Screen name="Home" component={Home} />
            <Tab.Screen name="Profile" component={Profile} />
          </Tab.Navigator>
        )}
      </AuthContext.Provider>
    </NavigationContainer>
  );
}

export default App;
