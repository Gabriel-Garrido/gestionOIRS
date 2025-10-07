import tailwindcss from '@tailwindcss/postcss'

// Tailwind 4.1: Solo se requiere el plugin oficial, sin autoprefixer.
export default {
  plugins: [tailwindcss()],
}
