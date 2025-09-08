import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink } from "lucide-react";

interface SlidesViewerProps {
  slidesUrl: string;
  downloadUrl: string;
  title: string;
  children?: React.ReactNode;
}

const SlidesViewer = ({ slidesUrl, downloadUrl, title, children }: SlidesViewerProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            View Slides
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col">
        <div className="flex-1 min-h-0">
          <iframe
            src={slidesUrl}
            title={title}
            className="w-full h-full border-0"
            allowFullScreen
          />
        </div>
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2 justify-center">
            <Button asChild variant="outline" size="sm">
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Separately
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SlidesViewer;