import AVFoundation
import AppKit
let a=CommandLine.arguments
let g=AVAssetImageGenerator(asset:AVURLAsset(url:URL(fileURLWithPath:a[1]))); g.requestedTimeToleranceBefore = .zero; g.requestedTimeToleranceAfter = .zero
let img=try! g.copyCGImage(at:CMTime(seconds:Double(a[3])!,preferredTimescale:600),actualTime:nil)
let rep=NSBitmapImageRep(cgImage:img); try! rep.representation(using:.jpeg,properties:[.compressionFactor:0.6])!.write(to:URL(fileURLWithPath:a[2]))
print(img.width,img.height)
