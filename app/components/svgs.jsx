import { Svg, Path, Circle, Line, Polyline } from 'react-native-svg';

export const SettingsIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="feather feather-settings"
    {...props}>
    <Circle cx="12" cy="12" r="3"></Circle>
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></Path>
  </Svg>
);

export const TeamIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="feather feather-users"
    {...props}>
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></Path>
    <Circle cx="9" cy="7" r="4"></Circle>
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87"></Path>
    <Path d="M16 3.13a4 4 0 0 1 0 7.75"></Path>
  </Svg>
);

export const ChartIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="feather feather-bar-chart-2"
    {...props}>
    <Line x1="18" y1="20" x2="18" y2="10"></Line>
    <Line x1="12" y1="20" x2="12" y2="4"></Line>
    <Line x1="6" y1="20" x2="6" y2="14"></Line>
  </Svg>
);

export const TrophyIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="feather feather-award"
    {...props}>
    <Circle cx="12" cy="8" r="7"></Circle>
    <Polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></Polyline>
  </Svg>
);

export const UserIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="feather feather-user"
    {...props}>
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></Path>
    <Circle cx="12" cy="7" r="4"></Circle>
  </Svg>
);

export const DiamondIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}>
    {/* Outer diamond shape with flat top */}
    <Path d="M8 2 L16 2 L22 9 L12 22 L2 9 Z" />

    {/* Facets */}
    <Line x1="2" y1="9" x2="22" y2="9" />
    <Line x1="8" y1="2" x2="12" y2="22" />
    <Line x1="16" y1="2" x2="12" y2="22" />
  </Svg>
);

export const SearchIcon = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="feather feather-search">
    <Circle cx="11" cy="11" r="8"></Circle>
    <Line x1="21" y1="21" x2="16.65" y2="16.65"></Line>
  </Svg>
);
