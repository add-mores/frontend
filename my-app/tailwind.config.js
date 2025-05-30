/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: ['./app/**/*.{js,ts,jsx,tsx}', './pages/**/*.{js,ts,jsx,tsx}',
		'./components/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
		extend: {
			colors: {
				border: "hsl(240, 5.9%, 90%)",       // 예: gray-200에 해당
				ring: "hsl(240, 5%, 64%)",           // outline-ring/50용
				background: "hsl(0, 0%, 100%)",       // 기본 배경
				foreground: "hsl(240, 10%, 3.9%)",    // 기본 텍스트
			},
		},
	},
	plugins: [],
}

