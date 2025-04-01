import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 lg:py-32 bg-gradient-to-br from-indigo-50 to-white">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Create Custom Typography with <span className="text-indigo-600">AI</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Generate beautiful custom fonts using AI-powered image generation or your own 
                uploaded images. Map characters, test your fonts, and share with the community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/create" 
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-center"
                >
                  Start Creating
                </Link>
                <Link 
                  href="/community" 
                  className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
                >
                  Browse Community
                </Link>
              </div>
              <div className="mt-4">
                <Link 
                  href="/supabase-diagnostics" 
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Supabase Diagnostics →
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              {/* Placeholder for hero image */}
              <div className="relative h-[400px] w-full bg-gray-100 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Font creation preview image
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Creating your own custom font is simple with our step-by-step process
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Generate or Upload",
                description: "Use AI to generate typeface images or upload your own designs",
                icon: "🖼️"
              },
              {
                title: "Map Characters",
                description: "Intuitively map characters to your images with our interactive tools",
                icon: "🔤"
              },
              {
                title: "Export & Share",
                description: "Download your font in multiple formats and optionally share with the community",
                icon: "💾"
              }
            ].map((step, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-lg">
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Features</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Everything you need to create professional custom typography
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              "AI-Powered Image Generation",
              "Interactive Character Mapping",
              "Real-time Font Testing",
              "Multiple Export Formats",
              "Community Sharing",
              "Personal Font Library"
            ].map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-800 font-medium">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-indigo-600">
        <div className="container mx-auto max-w-7xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to create your custom font?
          </h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of designers and typography enthusiasts creating unique fonts today.
          </p>
          <Link 
            href="/auth/register" 
            className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors inline-block"
          >
            Sign Up For Free
          </Link>
        </div>
      </section>
    </div>
  );
}
