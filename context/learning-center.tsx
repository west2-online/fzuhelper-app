import { LEARNING_CENTER_TOKEN_KEY } from '@/lib/constants';
import ApiService from '@/utils/learning-center/api-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface LearningCenter {
  token: string;
  api: ApiService;
  setToken: (token: string) => void;
}

export const LearningCenterContext = createContext<LearningCenter>({
  token: '',
  api: new ApiService(''),
  setToken: () => {},
});

export const LearningCenterContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [token, _setToken] = useState('');

  const setToken = useCallback((newToken: string) => {
    _setToken(newToken);
    AsyncStorage.setItem(LEARNING_CENTER_TOKEN_KEY, newToken);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(LEARNING_CENTER_TOKEN_KEY).then(token => token && _setToken(token));
  }, []);

  return (
    <LearningCenterContext.Provider value={{ token, api: new ApiService(token), setToken }}>
      {children}
    </LearningCenterContext.Provider>
  );
};

export const useLearningCenterApi = () => {
  const { api } = useContext(LearningCenterContext);

  if (!api) {
    throw new Error('LearningCenterContext not found');
  }

  return api;
};
