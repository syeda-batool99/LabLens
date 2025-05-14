import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <div className="flex flex-col items-center">
        <h1 className="text-4xl font-bold text-center mt-10 mb-6">
          Understand Your Medical Lab Reports
        </h1>
        
        <div className="max-w-3xl text-center mb-8">
          <p className="text-xl mb-6">
            Upload your medical lab reports and get instant, easy-to-understand explanations
            powered by artificial intelligence.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link href="/auth/signup" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
              Get Started
            </Link>
            <Link href="/auth/login" className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition">
              Log In
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-5xl">
          <FeatureCard 
            title="Upload Reports"
            description="Securely upload your medical lab reports in multiple formats."
            icon="📄"
          />
          <FeatureCard 
            title="AI Analysis"
            description="Get detailed explanations of your lab results in simple terms."
            icon="🧠"
          />
          <FeatureCard 
            title="Share & Access"
            description="Easily share reports with healthcare providers or access them anytime."
            icon="🔄"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}