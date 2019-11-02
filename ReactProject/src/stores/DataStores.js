import DataStore from "./DataStore.js";

const stores = {
  customer: new DataStore("customer"),
  application: new DataStore("application")
};
export default stores;
