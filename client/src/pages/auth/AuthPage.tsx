import { useParams } from "react-router-dom"
import { AuthView } from "@daveyplate/better-auth-ui"

export default function AuthPage() {
  const { pathname } = useParams()

  return (
    <main className="p-6 flex flex-col justify-center items-center h-[80vh]">
      <AuthView
        pathname={pathname}
        classNames={{
          base: 'bg-gray-950/80 ring ring-indigo-900/60 backdrop-blur-sm shadow-2xl shadow-indigo-950/30',
          title: 'text-white text-2xl font-bold',
          description: 'text-gray-400',
          footer: 'text-gray-400',
          footerLink: 'text-indigo-400 hover:text-indigo-300 font-semibold',
          form: {
            input: 'bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20',
            label: 'text-gray-300 font-medium',
            primaryButton: 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all active:scale-95',
            secondaryButton: 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700',
            forgotPasswordLink: 'text-indigo-400 hover:text-indigo-300',
          },
        }}
      />
    </main>
  )
}