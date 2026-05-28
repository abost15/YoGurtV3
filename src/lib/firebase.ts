import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const app = initializeApp({
  apiKey: 'AIzaSyC8_lPi6pU23hwyNlLkWbmecoAapE86fnE',
  authDomain: 'kremis-41de5.firebaseapp.com',
  databaseURL: 'https://kremis-41de5-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'kremis-41de5',
  storageBucket: 'kremis-41de5.firebasestorage.app',
  messagingSenderId: '517392229501',
  appId: '1:517392229501:web:03770212bbf2a45492fd14',
})

export const db = getDatabase(app)
