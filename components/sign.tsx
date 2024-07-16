"use client";

import React, { ComponentProps, useEffect } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useSign } from "@/providers/sign";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ToggleGroup } from "@radix-ui/react-toggle-group";
import { Tooltip } from "@/utils/components";

interface SignProps extends ComponentProps<"div"> {
  id: string;
}

const EMPTY_SVG = `<svg version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="react-sketch-canvas" style="width: 100%; height: 100%;" viewBox="0 0 250 100" width="250" height="100"><g id="react-sketch-canvas__eraser-stroke-group" display="none"><rect id="react-sketch-canvas__mask-background" x="0" y="0" width="100%" height="100%" fill="white"></rect></g><defs></defs><g id="react-sketch-canvas__canvas-background-group"><rect id="react-sketch-canvas__canvas-background" x="0" y="0" width="100%" height="100%" fill="transparent"></rect></g><g id="react-sketch-canvas__stroke-group-0" mask="url(#react-sketch-canvas__eraser-mask-0)"></g></svg>`;

const Sign = ({ id }: SignProps) => {
  const { setOpen } = useSign();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newSign: { svgText: string; id: string }) =>
      fetch("/api/sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSign),
      }).then(response => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signs", id] });
      setOpen(false);
    },
    onError: error => {
      console.error("Error submitting sign", error);
    },
  });

  const containerRef = React.useRef<HTMLDivElement>(null);

  const canvasRef = React.useRef<ReactSketchCanvasRef>(null);

  const handleClear = () => {
    canvasRef.current?.clearCanvas();
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  const handleAddSignature = async () => {
    const signature = await canvasRef.current?.exportSvg();

    const isBlank = signature === EMPTY_SVG;

    if (signature && !isBlank) {
      mutation.mutate({ svgText: signature, id });
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 8, scale: 0.75 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.75 }}
      transition={{ type: "spring", mass: 0.05, damping: 15, stiffness: 500 }}
    >
      <div className="absolute right-0 z-10 p-4 origin-bottom-right -translate-y-full border rounded-lg -top-4 bg-accent-900/90 border-accent-600/50 backdrop-blur shadow-deep">
        <button
          className="absolute grid w-6 h-6 text-sm bg-transparent border rounded-full top-3 right-3 border-accent-600/50 place-items-center text-accent-400 hover:bg-accent-800/50 "
          onClick={handleClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-3 h-3"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="mb-2 text-accent-200">Thanks for liking this post!</h3>
        <p className="mb-4 text-sm text-accent-400">Sketch your signature below to add it to the post.</p>
        <ReactSketchCanvas
          className="sketch-canvas"
          ref={canvasRef}
          width="250px"
          height="100px"
          canvasColor="transparent"
          strokeWidth={2}
        />
        <div className="flex items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-2">
            <Tooltip content="Clear">
              <button
                className="p-2 text-sm rounded-lg h-9 w-9 bg-red-500/50 hover:bg-red-500/75"
                onClick={handleClear}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-3.5 h-3.5 mx-auto"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>
            </Tooltip>
            <Tooltip content="Undo">
              <button
                className="p-2 text-sm rounded-lg h-9 w-9 bg-accent-500/50 hover:bg-accent-500/75"
                onClick={handleUndo}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={0}
                  stroke="currentColor"
                  className="w-3.5 h-3.5 mx-auto"
                >
                  <path
                    fill="currentColor"
                    d="M7 19v-2h7.1q1.575 0 2.738-1T18 13.5T16.838 11T14.1 10H7.8l2.6 2.6L9 14L4 9l5-5l1.4 1.4L7.8 8h6.3q2.425 0 4.163 1.575T20 13.5t-1.737 3.925T14.1 19z"
                  />
                </svg>
              </button>
            </Tooltip>
          </div>
          <button
            className="flex items-center justify-between gap-3 px-4 pr-5 text-sm rounded-lg h-9 bg-accent-800/50 hover:bg-accent-800/75 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddSignature}
            disabled={mutation.isPending}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33"
              />
            </svg>
            {mutation.isPending ? "Adding..." : "Add Signature"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default dynamic(() => Promise.resolve(Sign), {
  ssr: false,
});
