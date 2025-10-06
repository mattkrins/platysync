declare module 'rollup-plugin-visualizer' {
  import { Plugin } from 'vite';
  
  interface VisualizerOptions {
    filename?: string;
    title?: string;
    open?: boolean;
    template?: 'treemap' | 'sunburst' | 'network' | 'raw-data' | 'list';
    gzipSize?: boolean;
    brotliSize?: boolean;
    sourcemap?: boolean;
    projectRoot?: string;
  }
  
  export function visualizer(options?: VisualizerOptions): Plugin;
}
