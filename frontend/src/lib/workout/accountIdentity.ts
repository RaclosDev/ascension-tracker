let currentAccount: string | null = null;
let accountRevision = 0;

export const getWorkoutAccount = () => currentAccount;
export const getWorkoutAccountRevision = () => accountRevision;
export const setWorkoutAccountIdentity = (email: string | null) => {
  currentAccount = email;
  accountRevision++;
};
