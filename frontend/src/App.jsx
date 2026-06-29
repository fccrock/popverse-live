// src/App.jsx
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CollectionsProvider } from "./context/CollectionsContext";
import { ProfileProvider } from "./context/ProfileContext";
import { ClubsProvider } from "./context/ClubsContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import HomePage from "./pages/HomePage";
import CinemaPage from "./pages/CinemaPage";
import MoviesPage from "./pages/MoviesPage";
import TvShowsPage from "./pages/TvShowsPage";
import AnimePage from "./pages/AnimePage";
import MusicPage from "./pages/MusicPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import TvDetailPage from "./pages/TvDetailPage";
import PersonPage from "./pages/PersonPage";
import SearchPage from "./pages/SearchPage";

import CommunityPage from "./pages/CommunityPage";
import ClubDetailPage from "./pages/ClubDetailPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import CollectionDetailPage from "./pages/CollectionDetailPage";

import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("React Error Boundary Caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", background: "#330000", color: "white", minHeight: "100vh" }}>
          <h2>Something went wrong in React.</h2>
          <pre style={{ whiteSpace: "pre-wrap", color: "red" }}>{this.state.error && this.state.error.toString()}</pre>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px" }}>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Auth pages don't get the sidebar layout
function AuthRoute({ element }) { return element; }

export default function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <ProfileProvider>
        <CollectionsProvider>
          <ClubsProvider>
            <BrowserRouter>
            <Routes>
              {/* Auth pages — no sidebar */}
              <Route path="/login"           element={<AuthRoute element={<LoginPage />} />} />
              <Route path="/signup"          element={<AuthRoute element={<SignupPage />} />} />
              <Route path="/forgot-password" element={<AuthRoute element={<ForgotPasswordPage />} />} />

              {/* Main app — wrapped in Layout (sidebar) */}
              <Route path="/" element={
                <Layout>
                  <HomePage />
                </Layout>
              } />
              <Route path="/cinema" element={
                <Layout>
                  <CinemaPage />
                </Layout>
              } />
              <Route path="/movies" element={
                <Layout>
                  <MoviesPage />
                </Layout>
              } />
              <Route path="/tv-shows" element={
                <Layout>
                  <TvShowsPage />
                </Layout>
              } />
              <Route path="/anime" element={
                <Layout>
                  <AnimePage />
                </Layout>
              } />
              <Route path="/music" element={
                <Layout>
                  <MusicPage />
                </Layout>
              } />
              <Route path="/music/album/:id" element={
                <Layout>
                  <AlbumDetailPage />
                </Layout>
              } />
              <Route path="/cinema/:id" element={
                <Layout>
                  <MovieDetailPage />
                </Layout>
              } />
              <Route path="/tv/:id" element={
                <Layout>
                  <TvDetailPage />
                </Layout>
              } />
              <Route path="/person/:id" element={
                <Layout>
                  <PersonPage />
                </Layout>
              } />
              <Route path="/search" element={
                <Layout>
                  <SearchPage />
                </Layout>
              } />
              <Route path="/profile/:username" element={
                <Layout>
                  <ProfilePage />
                </Layout>
              } />
              <Route path="/collections" element={<Navigate to="/community" replace />} />
              <Route path="/community" element={
                <Layout>
                  <CommunityPage />
                </Layout>
              } />
              <Route path="/community/:slug" element={
                <Layout>
                  <ClubDetailPage />
                </Layout>
              } />
              <Route path="/collection/:id" element={
                <Layout>
                  <CollectionDetailPage />
                </Layout>
              } />
            </Routes>
            </BrowserRouter>
          </ClubsProvider>
        </CollectionsProvider>
      </ProfileProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
