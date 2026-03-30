import { renderHook, act } from "@testing-library/react";
import { useCamera } from "@/hooks/use-camera";

describe("useCamera", () => {
  const mockTrack = { stop: vi.fn() };
  const mockStream = {
    getTracks: vi.fn().mockReturnValue([mockTrack]),
  } as unknown as MediaStream;

  beforeEach(() => {
    mockTrack.stop.mockClear();
    mockStream.getTracks = vi.fn().mockReturnValue([mockTrack]);

    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      writable: true,
      configurable: true,
    });

    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-preview-url");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("startCamera sets isCapturing to true", async () => {
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.isCapturing).toBe(true);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: "environment" },
    });
  });

  it("stopCamera sets isCapturing to false and clears preview", async () => {
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });
    expect(result.current.isCapturing).toBe(true);

    act(() => {
      result.current.stopCamera();
    });

    expect(result.current.isCapturing).toBe(false);
    expect(result.current.preview).toBeNull();
    expect(mockTrack.stop).toHaveBeenCalled();
  });

  it("handleFileUpload creates preview URL and returns the file", () => {
    const { result } = renderHook(() => useCamera());
    const file = new File(["data"], "upload.jpg", { type: "image/jpeg" });

    let returnedFile: File | undefined;
    act(() => {
      returnedFile = result.current.handleFileUpload(file);
    });

    expect(returnedFile).toBe(file);
    expect(result.current.preview).toBe("blob:mock-preview-url");
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
  });

  it("capturePhoto returns null when no video ref is set", async () => {
    const { result } = renderHook(() => useCamera());

    let photo: File | null | undefined;
    await act(async () => {
      photo = await result.current.capturePhoto();
    });

    expect(photo).toBeNull();
  });

  it("isCapturing is initially false", () => {
    const { result } = renderHook(() => useCamera());
    expect(result.current.isCapturing).toBe(false);
  });

  it("preview is initially null", () => {
    const { result } = renderHook(() => useCamera());
    expect(result.current.preview).toBeNull();
  });
});
