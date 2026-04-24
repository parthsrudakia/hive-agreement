import AgreementForm from '@/components/AgreementForm';
import hiveLogo from '@/assets/hive-logo-new.png';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex justify-center">
          <img 
            src={hiveLogo} 
            alt="Hive - City Living, Made Simple" 
            className="h-12 md:h-14 w-auto object-contain"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Title Section */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight">
              Rent Agreement <span className="italic text-gradient-gold">Generator</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
              Fill in the details below to generate a professional rental agreement PDF.
            </p>
          </div>

          {/* Form */}
          <AgreementForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 text-center space-y-2">
        <p className="text-xs text-muted-foreground tracking-widest uppercase">
          Hive &middot; City Living, Made Simple
        </p>
        <p className="text-xs">
          <a
            href="/api-docs.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary underline underline-offset-4 tracking-wider uppercase"
          >
            API Documentation
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Index;
