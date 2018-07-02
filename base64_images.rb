require 'base64'

Dir['images/*.png'].each {|f|
    key = File.basename(f,'.png')
    base64 = Base64.strict_encode64(File.read(f))
    puts %Q{images['#{key}'] = '#{base64}';}
}
