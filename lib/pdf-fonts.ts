import { Font } from '@react-pdf/renderer';

// Register Arabic font if available locally or via URL
Font.register({
  family: 'Cairo',
  src: 'https://fonts.gstatic.com/s/cairo/v20/SLXVc1nY6HkvangtZmpcOQ.ttf' // Lightweight regular weight
});
