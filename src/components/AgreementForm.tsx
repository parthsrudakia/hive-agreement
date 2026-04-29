import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { generateAgreementPdf, AgreementData, GeneratedPdfDownload } from '@/lib/generatePdf';
import { useToast } from '@/hooks/use-toast';

const AgreementForm = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestDownload, setLatestDownload] = useState<GeneratedPdfDownload | null>(null);
  
  const [formData, setFormData] = useState({
    tenantName: '',
    sublessorName: 'Vineet Dutta',
    propertyAddress: '',
    rent: '',
    proRateRent: '',
    securityDeposit: '',
    leaseStartDate: undefined as Date | undefined,
    leaseEndDate: undefined as Date | undefined,
    agreementDate: undefined as Date | undefined,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (field: string, date: Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  const isFormValid = () => {
    return (
      formData.tenantName.trim() !== '' &&
      formData.sublessorName.trim() !== '' &&
      formData.propertyAddress.trim() !== '' &&
      formData.rent.trim() !== '' &&
      formData.securityDeposit.trim() !== '' &&
      formData.leaseStartDate !== undefined &&
      formData.leaseEndDate !== undefined &&
      formData.agreementDate !== undefined
    );
  };

  const handleGeneratePdf = async (includeLetterhead: boolean) => {
    if (!isFormValid()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields before generating the agreement.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const agreementData: AgreementData = {
        tenantName: formData.tenantName,
        sublessorName: formData.sublessorName,
        propertyAddress: formData.propertyAddress,
        rent: formData.rent,
        proRateRent: formData.proRateRent,
        securityDeposit: formData.securityDeposit,
        leaseStartDate: formData.leaseStartDate!.toISOString(),
        leaseEndDate: formData.leaseEndDate!.toISOString(),
        agreementDate: formData.agreementDate!.toISOString(),
      };

      if (latestDownload) {
        URL.revokeObjectURL(latestDownload.url);
      }

      const download = await generateAgreementPdf(agreementData, includeLetterhead);
      setLatestDownload(download);

      toast({
        title: 'PDF Generated!',
        description: 'If the download did not start, use the download link below.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-card border border-border rounded-lg p-6 md:p-8 space-y-6 animate-fade-in">
      {/* Tenant & Sublessor Names */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="tenantName" className="text-xs uppercase tracking-wider text-muted-foreground">
            Tenant Name (Sublessee)
          </Label>
          <Input
            id="tenantName"
            placeholder="e.g., Praveen Kumar Anwla"
            value={formData.tenantName}
            onChange={(e) => handleInputChange('tenantName', e.target.value)}
            className="h-11 bg-secondary/50 border-border focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sublessorName" className="text-xs uppercase tracking-wider text-muted-foreground">
            Sublessor Name
          </Label>
          <Input
            id="sublessorName"
            placeholder="e.g., Vineet Dutta"
            value={formData.sublessorName}
            onChange={(e) => handleInputChange('sublessorName', e.target.value)}
            className="h-11 bg-secondary/50 border-border focus:border-primary"
          />
        </div>
      </div>

      {/* Property Address */}
      <div className="space-y-2">
        <Label htmlFor="propertyAddress" className="text-xs uppercase tracking-wider text-muted-foreground">
          Property Address
        </Label>
        <Input
          id="propertyAddress"
          placeholder="e.g., 161 Van Wagenen Ave, Jersey City, NJ 07306"
          value={formData.propertyAddress}
          onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
          className="h-11 bg-secondary/50 border-border focus:border-primary"
        />
      </div>

      {/* Rent, Pro Rate & Security Deposit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-2">
          <Label htmlFor="rent" className="text-xs uppercase tracking-wider text-muted-foreground">
            Monthly Rent ($)
          </Label>
          <Input
            id="rent"
            type="number"
            placeholder="e.g., 1650"
            value={formData.rent}
            onChange={(e) => handleInputChange('rent', e.target.value)}
            className="h-11 bg-secondary/50 border-border focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="proRateRent" className="text-xs uppercase tracking-wider text-muted-foreground">
            Prorated Rent ($)
          </Label>
          <Input
            id="proRateRent"
            type="number"
            placeholder="Optional"
            value={formData.proRateRent}
            onChange={(e) => handleInputChange('proRateRent', e.target.value)}
            className="h-11 bg-secondary/50 border-border focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="securityDeposit" className="text-xs uppercase tracking-wider text-muted-foreground">
            Security Deposit ($)
          </Label>
          <Input
            id="securityDeposit"
            type="number"
            placeholder="e.g., 1650"
            value={formData.securityDeposit}
            onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
            className="h-11 bg-secondary/50 border-border focus:border-primary"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Lease Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full h-11 justify-start text-left font-normal bg-secondary/50 border-border hover:bg-secondary',
                  !formData.leaseStartDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.leaseStartDate ? (
                  format(formData.leaseStartDate, 'PPP')
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.leaseStartDate}
                onSelect={(date) => handleDateChange('leaseStartDate', date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Lease End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full h-11 justify-start text-left font-normal bg-secondary/50 border-border hover:bg-secondary',
                  !formData.leaseEndDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.leaseEndDate ? (
                  format(formData.leaseEndDate, 'PPP')
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.leaseEndDate}
                onSelect={(date) => handleDateChange('leaseEndDate', date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Agreement Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full h-11 justify-start text-left font-normal bg-secondary/50 border-border hover:bg-secondary',
                  !formData.agreementDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.agreementDate ? (
                  format(formData.agreementDate, 'PPP')
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.agreementDate}
                onSelect={(date) => handleDateChange('agreementDate', date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Generate Buttons */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={() => handleGeneratePdf(true)}
            disabled={isGenerating}
            className="h-12 text-sm font-semibold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <FileText className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating...' : 'With Letterhead'}
          </Button>
          <Button
            onClick={() => handleGeneratePdf(false)}
            disabled={isGenerating}
            variant="outline"
            className="h-12 text-sm font-semibold uppercase tracking-wider border border-border hover:bg-secondary"
          >
            <FileText className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Plain PDF'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          PDFs will be automatically downloaded to your device
        </p>
        {latestDownload && (
          <a
            href={latestDownload.url}
            download={latestDownload.fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm font-semibold text-primary underline underline-offset-4"
          >
            Download latest PDF
          </a>
        )}
      </div>
    </div>
  );
};

export default AgreementForm;
