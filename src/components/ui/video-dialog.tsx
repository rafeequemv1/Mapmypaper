import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
interface VideoDialogProps {
  videoUrl: string;
  title?: string;
  description?: string;
  triggerText?: string;
}
const VideoDialog: React.FC<VideoDialogProps> = ({
  videoUrl,
  title = "Watch Demo",
  description = "Learn more about our features and capabilities",
  triggerText = "Watch Demo"
}) => {
  // Extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };
  const videoId = getYouTubeVideoId(videoUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  return <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 border-white/20 hover:bg-white/10">
          <Play className="w-4 h-4" />
          <span className="text-gray-950">{triggerText}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="aspect-video w-full overflow-hidden rounded-md">
          {embedUrl && <iframe src={embedUrl} title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full border-0" />}
        </div>
      </DialogContent>
    </Dialog>;
};
export default VideoDialog;