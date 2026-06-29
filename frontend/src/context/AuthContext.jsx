import { createContext, useContext, useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import { signIn, signUp, signOut, resetPassword, confirmResetPassword, getCurrentUser, fetchAuthSession, confirmSignUp } from "aws-amplify/auth";

// Configure Amplify for Cognito
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || "us-east-1_placeholder",
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || "placeholder_client_id",
    }
  }
});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const preferredUsername = session.tokens?.idToken?.payload?.preferred_username || currentUser.username;
      setUser({
        ...currentUser,
        preferredUsername
      });
      setIsAuthenticated(true);
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email, password) {
    try {
      const { isSignedIn, nextStep } = await signIn({ username: email, password });
      if (isSignedIn) {
        await checkUser();
        return { success: true, nextStep };
      } else {
        let errMsg = `Sign-in incomplete: ${nextStep.signInStep}`;
        if (nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
          errMsg = "AWS Cognito requires you to set a new password. Please delete this user from the AWS Console and sign up through the website's Create Account screen.";
        } else if (nextStep.signInStep === "CONFIRM_SIGN_UP") {
          errMsg = "Your registration is not confirmed yet. Please verify your account.";
        }
        return { success: false, error: errMsg, nextStep };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }


  async function register(email, username, password) {
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            preferred_username: username,
          }
        }
      });
      return { success: true, nextStep };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async function confirmRegister(email, code) {
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async function logout() {
    try {
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  }

  async function triggerForgotPassword(email) {
    try {
      const output = await resetPassword({ username: email });
      return { success: true, nextStep: output.nextStep };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async function confirmForgotPasswordCall(email, code, newPassword) {
    try {
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      confirmRegister,
      logout,
      triggerForgotPassword,
      confirmForgotPasswordCall
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

