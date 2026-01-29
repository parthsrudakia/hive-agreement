import AgreementForm from '@/components/AgreementForm';
import hiveLetterhead from '@/assets/hive-letterhead.png';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <img 
            src={hiveLetterhead} 
            alt="Hive New York Living" 
            className="h-10 w-auto object-contain"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Hero Section */}
          <div className="text-center space-y-3 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Rental Agreement Generator
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Create professional sublease agreements in seconds. Fill in the details and download your PDF instantly.
            </p>
          </div>

          {/* Form */}
          <AgreementForm />

          {/* Footer Note */}
          <p className="text-center text-sm text-muted-foreground pt-6">
            Generated agreements include all standard terms and conditions for NYC sublet arrangements.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
