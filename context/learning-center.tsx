import { LEARNING_CENTER_TOKEN_KEY } from '@/lib/constants';
import ApiService from '@/utils/learning-center/api-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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

  const api = useMemo(() => new ApiService(token), [token]);

  const value = useMemo(() => ({ token, api, setToken }), [token, api, setToken]);

  return <LearningCenterContext.Provider value={value}>{children}</LearningCenterContext.Provider>;
};

export const useLearningCenterApi = () => {
  const { api } = useContext(LearningCenterContext);

  if (!api) {
    throw new Error('LearningCenterContext not found');
  }

  return api;
};
