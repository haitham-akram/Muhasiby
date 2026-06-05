import path from 'path'
import { Font } from '@react-pdf/renderer'

// Use locally bundled font files to avoid network failures at render time
Font.register({
  family: 'Cairo',
  fonts: [
    {
      src: path.join(process.cwd(), 'public/fonts/Cairo-Regular.ttf'),
      fontWeight: 'normal',
    },
    {
      src: path.join(process.cwd(), 'public/fonts/Cairo-Bold.ttf'),
      fontWeight: 'bold',
    },
  ],
})
