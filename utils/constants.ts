export interface IThemeColors {
  accent50: string;
  accent100: string;
  accent200: string;
  accent300: string;
  accent400: string;
  accent500: string;
  accent600: string;
  accent700: string;
  accent800: string;
  accent850: string;
  accent900: string;
}

export const THEMES = {
  obsidian: {
    accent50: "#f6f7f9",
    accent100: "#eceef2",
    accent200: "#d5d9e2",
    accent300: "#b0b7c9",
    accent400: "#8590ab",
    accent500: "#657292",
    accent600: "#515b78",
    accent700: "#424a62",
    accent800: "#394053",
    accent850: "#333847",
    accent900: "#0d0e12",
  },
  eclipse: {
    accent50: "#f6f6f6",
    accent100: "#e7e7e7",
    accent200: "#d1d1d1",
    accent300: "#b0b0b0",
    accent400: "#888888",
    accent500: "#6d6d6d",
    accent600: "#5d5d5d",
    accent700: "#4f4f4f",
    accent800: "#454545",
    accent850: "#3d3d3d",
    accent900: "#171717",
  },
  phantom: {
    accent50: "#f7f6f9",
    accent100: "#eeecf2",
    accent200: "#dad5e2",
    accent300: "#b9b0c9",
    accent400: "#9385ab",
    accent500: "#756592",
    accent600: "#5f5178",
    accent700: "#4e4262",
    accent800: "#423953",
    accent850: "#3a3347",
    accent900: "#0e0d12",
  },
  velvet: {
    accent50: "#f9f6f8",
    accent100: "#f2ecf0",
    accent200: "#e2d5dd",
    accent300: "#c9b0bf",
    accent400: "#ab859a",
    accent500: "#92657d",
    accent600: "#785165",
    accent700: "#624254",
    accent800: "#533948",
    accent850: "#47333e",
    accent900: "#120d0f",
  },
  emerald: {
    accent50: "#f6f9f7",
    accent100: "#ecf2ee",
    accent200: "#d5e2da",
    accent300: "#b0c9b9",
    accent400: "#85ab96",
    accent500: "#65927b",
    accent600: "#517863",
    accent700: "#426251",
    accent800: "#395345",
    accent850: "#33473c",
    accent900: "#0d120f",
  },
  horizon: {
    accent50: "#f9f8f6",
    accent100: "#f2f0ec",
    accent200: "#e2ddd5",
    accent300: "#c9bfb0",
    accent400: "#aba185",
    accent500: "#928565",
    accent600: "#786c51",
    accent700: "#625942",
    accent800: "#534c39",
    accent850: "#474233",
    accent900: "#12110d",
  },
  daybreak: {
    accent900: "#f6f7f9",
    accent850: "#eceef2",
    accent800: "#d5d9e2",
    accent700: "#b0b7c9",
    accent600: "#8590ab",
    accent500: "#657292",
    accent400: "#515b78",
    accent300: "#424a62",
    accent200: "#394053",
    accent100: "#333847",
    accent50: "#0d0e12",
  },
  frost: {
    accent900: "#f6f9f9",
    accent850: "#ecf2f2",
    accent800: "#b0c9c9",
    accent700: "#93b5b4",
    accent600: "#85abab",
    accent500: "#659292",
    accent400: "#517878",
    accent300: "#426262",
    accent200: "#394545",
    accent100: "#333d3d",
    accent50: "#0d1212",
  },
  aurora: {
    accent900: "#f9f6f9",
    accent850: "#f2ecf2",
    accent800: "#c9b0c9",
    accent700: "#c9a8ca",
    accent600: "#ab85ab",
    accent500: "#926592",
    accent400: "#785178",
    accent300: "#624262",
    accent200: "#533945",
    accent100: "#47333d",
    accent50: "#120d12",
  },
  dawn: {
    accent900: "#f9f9f6",
    accent850: "#f2f2ec",
    accent800: "#c9c9b0",
    accent700: "#bbba9b",
    accent600: "#abab85",
    accent500: "#929265",
    accent400: "#787851",
    accent300: "#626242",
    accent200: "#454539",
    accent100: "#3d3d33",
    accent50: "#11120d",
  },
};

export const LIGHT_THEMES = ["daybreak", "frost", "aurora", "dawn"];

export type TThemeName = keyof typeof THEMES;
