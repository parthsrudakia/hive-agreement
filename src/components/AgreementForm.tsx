import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, FileText, Building2 } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateAgreementPdf, AgreementData } from '@/lib/generatePdf';
import { useToast } from '@/hooks/use-toast';

const AgreementForm = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    tenantName: '',
    sublessorName: 'Vineet Dutta',
    propertyAddress: '',
    rent: '',
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
        securityDeposit: formData.securityDeposit,
        leaseStartDate: formData.leaseStartDate!.toISOString(),
        leaseEndDate: formData.leaseEndDate!.toISOString(),
        agreementDate: formData.agreementDate!.toISOString(),
      };

      await generateAgreementPdf(agreementData, includeLetterhead);

      toast({
        title: 'PDF Generated!',
        description: `Agreement for ${formData.tenantName} has been downloaded.`,
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
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-0 animate-fade-in">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Rent Agreement Generator</CardTitle>
            <CardDescription className="text-muted-foreground">
              Fill in the details below to generate a rental agreement PDF
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tenant & Sublessor Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tenantName" className="text-sm font-medium">
              Tenant Name (Sublessee)
            </Label>
            <Input
              id="tenantName"
              placeholder="e.g., Praveen Kumar Anwla"
              value={formData.tenantName}
              onChange={(e) => handleInputChange('tenantName', e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sublessorName" className="text-sm font-medium">
              Sublessor Name
            </Label>
            <Input
              id="sublessorName"
              placeholder="e.g., Vineet Dutta"
              value={formData.sublessorName}
              onChange={(e) => handleInputChange('sublessorName', e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        {/* Property Address */}
        <div className="space-y-2">
          <Label htmlFor="propertyAddress" className="text-sm font-medium">
            Property Address
          </Label>
          <Input
            id="propertyAddress"
            placeholder="e.g., 161 Van Wagenen Ave, Jersey City, NJ 07306"
            value={formData.propertyAddress}
            onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
            className="h-11"
          />
        </div>

        {/* Rent & Security Deposit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rent" className="text-sm font-medium">
              Monthly Rent ($)
            </Label>
            <Input
              id="rent"
              type="number"
              placeholder="e.g., 1650"
              value={formData.rent}
              onChange={(e) => handleInputChange('rent', e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="securityDeposit" className="text-sm font-medium">
              Security Deposit ($)
            </Label>
            <Input
              id="securityDeposit"
              type="number"
              placeholder="e.g., 1650"
              value={formData.securityDeposit}
              onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Lease Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-11 justify-start text-left font-normal',
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
            <Label className="text-sm font-medium">Lease End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-11 justify-start text-left font-normal',
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
            <Label className="text-sm font-medium">Agreement Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-11 justify-start text-left font-normal',
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

        {/* Generate Buttons */}
        <div className="pt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={() => handleGeneratePdf(true)}
              disabled={isGenerating}
              className="h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <FileText className="mr-2 h-5 w-5" />
              {isGenerating ? 'Generating...' : 'Generate with Hive Letterhead'}
            </Button>
            <Button
              onClick={() => handleGeneratePdf(false)}
              disabled={isGenerating}
              variant="outline"
              className="h-12 text-base font-semibold border-2 hover:bg-secondary"
            >
              <FileText className="mr-2 h-5 w-5" />
              {isGenerating ? 'Generating...' : 'Generate Plain PDF'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            PDFs will be automatically downloaded to your device
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgreementForm;
