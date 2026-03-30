import { resizeImage } from "@/lib/image-utils";

describe("resizeImage", () => {
  let mockCanvas: {
    width: number;
    height: number;
    getContext: ReturnType<typeof vi.fn>;
    toBlob: ReturnType<typeof vi.fn>;
  };
  let mockContext: { drawImage: ReturnType<typeof vi.fn> };
  let capturedImageInstance: {
    onload: (() => void) | null;
    src: string;
    width: number;
    height: number;
  };

  beforeEach(() => {
    mockContext = { drawImage: vi.fn() };
    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockContext),
      toBlob: vi.fn(),
    };

    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "canvas") return mockCanvas as unknown as HTMLElement;
      return document.createElement(tag);
    });

    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    // Mock Image class with a simple approach to trigger onload when src is set
    capturedImageInstance = { onload: null, src: "", width: 800, height: 600 };
    vi.stubGlobal("Image", function MockImage(this: Record<string, unknown>) {
      let srcValue = "";
      this.onload = null;
      this.width = 800;
      this.height = 600;
      Object.defineProperty(this, "src", {
        get() {
          return srcValue;
        },
        set(val: string) {
          srcValue = val;
          setTimeout(() => {
            if (typeof this.onload === "function") this.onload();
          }, 0);
        },
      });
      capturedImageInstance = this as unknown as typeof capturedImageInstance;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns a File object", async () => {
    const mockBlob = new Blob(["fake-image"], { type: "image/jpeg" });
    mockCanvas.toBlob.mockImplementation(
      (cb: (blob: Blob | null) => void) => cb(mockBlob)
    );

    const input = new File(["test"], "photo.png", { type: "image/png" });
    const result = await resizeImage(input);

    expect(result).toBeInstanceOf(File);
  });

  it("preserves the original filename", async () => {
    const mockBlob = new Blob(["fake-image"], { type: "image/jpeg" });
    mockCanvas.toBlob.mockImplementation(
      (cb: (blob: Blob | null) => void) => cb(mockBlob)
    );

    const input = new File(["test"], "my-photo.png", { type: "image/png" });
    const result = await resizeImage(input);

    expect(result.name).toBe("my-photo.png");
  });

  it("outputs jpeg type", async () => {
    const mockBlob = new Blob(["fake-image"], { type: "image/jpeg" });
    mockCanvas.toBlob.mockImplementation(
      (cb: (blob: Blob | null) => void) => cb(mockBlob)
    );

    const input = new File(["test"], "photo.png", { type: "image/png" });
    const result = await resizeImage(input);

    expect(result.type).toBe("image/jpeg");
  });

  it("falls back to original file when toBlob returns null", async () => {
    mockCanvas.toBlob.mockImplementation(
      (cb: (blob: Blob | null) => void) => cb(null)
    );

    const input = new File(["test"], "photo.png", { type: "image/png" });
    const result = await resizeImage(input);

    expect(result).toBe(input);
  });

  it("revokes the object URL after image loads", async () => {
    const mockBlob = new Blob(["fake-image"], { type: "image/jpeg" });
    mockCanvas.toBlob.mockImplementation(
      (cb: (blob: Blob | null) => void) => cb(mockBlob)
    );

    const input = new File(["test"], "photo.png", { type: "image/png" });
    await resizeImage(input);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});
