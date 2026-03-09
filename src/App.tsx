import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import { HomePage } from "./Page/homepage";
import { Navbar } from "./components/navbar";
import { Login } from "./Page/login";
import { Register } from "./Page/register";
import { ForgotPassword } from "./Page/forgetpassword";
import { ProfilePage } from "./Page/profile";
import { HistoryPage } from "./Page/history";

import { MyBookmarksPage } from "./Page/mybookmark";
import { MyDashborad } from "./Page/dashborad";

import { CreateNovel } from "./Page/createNovel";
import { AddChapterPage } from "./Page/addchapter";
import { Noveldetailpage } from "./Page/noveldetail";
import { Readchapterpage } from "./Page/readnovel";
import { EditNovelPage } from "./Page/editnovel";
import { EditChapterPage } from "./Page/editchapter";


import { CreateMangaPage } from "./Page/createManga";
import { CreateMangaChapterPage } from "./Page/createMangaChapter";
import { MangaDetailPage } from "./Page/mangadetail";
import { ReadMangaPage } from "./Page/readmanga";
import { EditMangaPage } from "./Page/editmanga";
import { EditMangaChapterPage } from "./Page/editchaptermanga";


function App() {
  const token = localStorage.getItem('token')
  return(
    <BrowserRouter>
      <Navbar/> 
      <div style={{ /* padding: 20 */ }}>
        <Routes>
          <Route path="/" element={< HomePage />} />
          <Route path="/profile" element={token ? <ProfilePage/> : <Navigate to="/login"/>}/>

          <Route path="/login" element={<Login/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/forgetpassword" element={<ForgotPassword/>}/>
          
          <Route path="/createnovel" element={token ? <CreateNovel /> : <Navigate to="/login" />} />
          <Route path="/dashborad" element={token ? <MyDashborad /> : <Navigate to="/login" />} />
          <Route path="/novel/:id/chapters" element={token ? <AddChapterPage />:<Navigate to="login"/>} />
          <Route path="/novel/:id/edit/" element={token ? <EditNovelPage/> : <Navigate to="/login"/>} /> 
          <Route path="/novel/:id" element={<Noveldetailpage/>}/>
          <Route path="/novel/:id/chapters/:chapterId" element={<Readchapterpage/>}/>
          <Route path="/novel/:id/chapters/:chapterId/edit" element={token ? <EditChapterPage /> : <Navigate to="/login"/>} />
          <Route path="/my-bookmarks" element={token ? <MyBookmarksPage /> : <Navigate to= "/login"/>} />

          <Route path="/createmanga" element={token ? <CreateMangaPage/> : <Navigate to="/login"/>}/> 
          <Route path="/manga/:id/chapters" element={token ? <CreateMangaChapterPage /> : <Navigate to="/login"/>} />
          <Route path="/manga/:id/"element={<MangaDetailPage/>}/>
          <Route path="/manga/:id/chapters/:chapterId" element={<ReadMangaPage />} />
          <Route path="/manga/:id/edit" element={token ? <EditMangaPage /> : <Navigate to="/login"/>} />
          <Route path="/manga/:id/chapter/:chapterId/edit" element={token ? <EditMangaChapterPage/> : <Navigate to="/login"/>}/>
          <Route path="/history" element={token ?<HistoryPage />  : <Navigate to="/login"/>} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
export default App