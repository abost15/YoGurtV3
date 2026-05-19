import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const app = initializeApp({
  apiKey: 'AIzaSyDqh-jXM82F7-qB0Ug7PeVmazdlpmpdNXQ',
  authDomain: 'yogurt-f0fa7.firebaseapp.com',
  databaseURL: 'https://yogurt-f0fa7-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'yogurt-f0fa7',
  storageBucket: 'yogurt-f0fa7.firebasestorage.app',
  messagingSenderId: '551580292785',
  appId: '1:551580292785:web:9a125688c28dae507af490',
})

export const db = getDatabase(app)
