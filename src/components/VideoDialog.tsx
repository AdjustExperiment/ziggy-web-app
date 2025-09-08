import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface VideoDialogProps {
  youtubeId: string;
  title: string;
  children?: React.ReactNode;
}

const VideoDialog = ({ youtubeId, title, children }: VideoDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Play className="h-4 w-4" />
            Watch Example
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[90vw] p-0">
        <div className="aspect-video w-full">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={title}
            className="w-full h-full rounded-lg"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoDialog;